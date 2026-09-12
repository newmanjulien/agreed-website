import {
	parseFragment,
	type DefaultTreeAdapterTypes,
	type ParserError
} from 'parse5';
import type {
	BlockNode,
	HeadingNode,
	ParagraphNode,
	SignatureGridNode,
	SignaturePartyNode,
	ClauseNode,
	TextMarks,
	TextNode,
	ValueNode
} from '../../document/types.ts';
import type {
	AgreementCompileResult,
	AgreementSourceIssue
} from '../../agreement-source-result.ts';
import type {
	ChangesControlDefinition,
	ClauseRegistry
} from '../../document/agreement-model.ts';

type HtmlNode = DefaultTreeAdapterTypes.ChildNode;
type HtmlElement = DefaultTreeAdapterTypes.Element;
type SpecialInlineNode = ClauseNode | ValueNode;

interface CompileState {
	issues: AgreementSourceIssue[];
	clauseIds: Set<string>;
	clauseDocumentValueIds: Map<string, Set<string>>;
	headingIds: Set<string>;
	clauses: ClauseRegistry;
}

interface CompiledBlock {
	block: BlockNode;
	source: HtmlElement;
}

const SLUG = /^[a-z][a-z0-9-]*$/u;
const NO_ATTRIBUTES = new Set<string>();
const ID_ATTRIBUTE = new Set(['id']);
const SIGNATURE_ATTRIBUTES = new Set(['provider', 'customer']);
const CLAUSE_HIGHLIGHT_TONES = new Set(['informational', 'editable']);

function isElement(node: HtmlNode): node is HtmlElement {
	return 'tagName' in node;
}

function isText(node: HtmlNode): node is DefaultTreeAdapterTypes.TextNode {
	return node.nodeName === '#text';
}

function sourcePosition(
	node?: HtmlNode,
	attributeName?: string
): Pick<AgreementSourceIssue, 'line' | 'column'> {
	if (!node?.sourceCodeLocation) return {};

	const attributeLocation =
		attributeName && isElement(node)
			? node.sourceCodeLocation.attrs?.[attributeName]
			: undefined;
	const location = attributeLocation ?? node.sourceCodeLocation;
	return { line: location.startLine, column: location.startCol };
}

function addIssue(
	state: CompileState,
	code: string,
	message: string,
	node?: HtmlNode,
	attributeName?: string
): void {
	state.issues.push({ code, message, ...sourcePosition(node, attributeName) });
}

function normalizeText(value: string): string {
	return value.replace(/[\t\n\f\r ]+/gu, ' ');
}

function sameMarks(left: TextNode, right: TextNode): boolean {
	return (
		Boolean(left.marks?.bold) === Boolean(right.marks?.bold) &&
		Boolean(left.marks?.italic) === Boolean(right.marks?.italic)
	);
}

function appendText<T extends SpecialInlineNode>(
	output: Array<TextNode | T>,
	value: string,
	marks: TextMarks
): void {
	let normalized = normalizeText(value);
	const previous = output.at(-1);
	if (normalized.startsWith(' ') && previous?.type === 'text' && previous.value.endsWith(' ')) {
		normalized = normalized.slice(1);
	}
	const next: TextNode = {
		type: 'text',
		value: normalized,
		...(marks.bold || marks.italic ? { marks: { ...marks } } : {})
	};
	if (previous?.type === 'text' && sameMarks(previous, next)) {
		output[output.length - 1] = { ...previous, value: previous.value + next.value };
		return;
	}

	output.push(next);
}

function trimBoundaryWhitespace<T extends SpecialInlineNode>(
	nodes: Array<TextNode | T>
): Array<TextNode | T> {
	if (!nodes.length) return nodes;

	return nodes
		.map((node, index) => {
			if (node.type !== 'text') return node;
			let value = node.value;
			if (index === 0) value = value.trimStart();
			if (index === nodes.length - 1) value = value.trimEnd();
			return value === node.value ? node : { ...node, value };
		})
		.filter((node) => node.type !== 'text' || node.value.length > 0);
}

function readAttributes(
	element: HtmlElement,
	allowed: ReadonlySet<string>,
	state: CompileState
): Record<string, string> {
	const values: Record<string, string> = {};

	for (const attribute of element.attrs) {
		if (!allowed.has(attribute.name)) {
			addIssue(
				state,
				'unsupported-attribute',
				`<${element.tagName}> does not support the "${attribute.name}" attribute.`,
				element,
				attribute.name
			);
			continue;
		}
		values[attribute.name] = attribute.value;
	}

	return values;
}

function requireClosingTag(element: HtmlElement, state: CompileState): void {
	if (element.sourceCodeLocation && !element.sourceCodeLocation.endTag) {
		addIssue(
			state,
			'missing-closing-tag',
			`<${element.tagName}> must have a closing tag.`,
			element
		);
	}
}

function compileValue(
	element: HtmlElement,
	state: CompileState,
	marks: TextMarks,
	clauseId?: string
): ValueNode | null {
	const issueCount = state.issues.length;
	const id = readAttributes(element, ID_ATTRIBUTE, state).id;
	requireClosingTag(element, state);

	if (!id) {
		addIssue(state, 'missing-value-id', '<agreement-value> requires an id.', element);
	} else if (!SLUG.test(id)) {
		addIssue(state, 'invalid-value-id', `Value id "${id}" must be a lowercase slug.`, element);
	} else if (clauseId) {
		const valueIds = state.clauseDocumentValueIds.get(clauseId) ?? new Set<string>();
		valueIds.add(id);
		state.clauseDocumentValueIds.set(clauseId, valueIds);

		if (!state.clauses[clauseId]?.values?.[id]) {
			addIssue(
				state,
				'unknown-clause-value',
				`Clause "${clauseId}" does not define value "${id}".`,
				element
			);
		}
	}

	if (element.childNodes.some((child) => !isText(child) || child.value.trim())) {
		addIssue(state, 'value-content', '<agreement-value> must be empty.', element);
	}

	return state.issues.length === issueCount && id
		? {
				type: 'value',
				id,
				...(marks.bold || marks.italic ? { marks: { ...marks } } : {})
			}
		: null;
}

function compileInline<T extends SpecialInlineNode>(
	nodes: HtmlNode[],
	state: CompileState,
	context: string,
	compileElement: (element: HtmlElement, marks: TextMarks) => T | null
): Array<TextNode | T> {
	const output: Array<TextNode | T> = [];

	function visit(children: HtmlNode[], marks: TextMarks): void {
		for (const node of children) {
			if (isText(node)) {
				appendText(output, node.value, marks);
				continue;
			}
			if (!isElement(node)) {
				addIssue(state, 'unsupported-content', `${context} content must be text.`, node);
				continue;
			}

			if (node.tagName === 'strong' || node.tagName === 'em') {
				readAttributes(node, NO_ATTRIBUTES, state);
				requireClosingTag(node, state);
				visit(node.childNodes, {
					...marks,
					...(node.tagName === 'strong' ? { bold: true } : { italic: true })
				});
				continue;
			}

			const compiled = compileElement(node, marks);
			if (compiled) output.push(compiled);
		}
	}

	visit(nodes, {});
	return trimBoundaryWhitespace(output);
}

function compileClause(
	element: HtmlElement,
	state: CompileState,
	paragraphClauseIds: Set<string>
): ClauseNode | null {
	const issueCount = state.issues.length;
	const id = readAttributes(element, ID_ATTRIBUTE, state).id;
	requireClosingTag(element, state);

	if (!id) {
		addIssue(state, 'missing-clause-id', '<agreement-clause> requires an id.', element);
	} else if (!SLUG.test(id)) {
		addIssue(state, 'invalid-clause-id', `Clause id "${id}" must be a lowercase slug.`, element);
	} else if (state.clauseIds.has(id) || paragraphClauseIds.has(id)) {
		addIssue(state, 'duplicate-clause-id', `Duplicate clause id "${id}".`, element);
	}

	const content = compileInline<ValueNode>(
		element.childNodes,
		state,
		'a clause',
		(node, childMarks) => {
			if (node.tagName === 'agreement-value') {
				return compileValue(node, state, childMarks, id);
			}
			if (node.tagName === 'agreement-clause') {
				addIssue(state, 'nested-clause', 'Clauses cannot be nested.', node);
			} else {
				addIssue(
					state,
					'unsupported-inline-content',
					`<${node.tagName}> is not supported inside a clause.`,
					node
				);
			}
			return null;
		}
	);
	if (
		state.issues.length === issueCount &&
		!content.some((node) => node.type === 'value' || Boolean(node.value.trim()))
	) {
		addIssue(state, 'empty-clause', 'Clauses cannot be empty.', element);
	}

	if (state.issues.length !== issueCount || !id) return null;
	paragraphClauseIds.add(id);
	return { type: 'clause', id, content };
}

function compileHeading(element: HtmlElement, state: CompileState): HeadingNode | null {
	const issueCount = state.issues.length;
	const anchor = readAttributes(element, ID_ATTRIBUTE, state).id;
	requireClosingTag(element, state);

	if (!anchor) {
		addIssue(state, 'missing-heading-id', `<${element.tagName}> requires an id.`, element);
	} else if (!SLUG.test(anchor)) {
		addIssue(
			state,
			'invalid-heading-id',
			`Heading id "${anchor}" must be a lowercase slug.`,
			element
		);
	} else if (state.headingIds.has(anchor)) {
		addIssue(state, 'duplicate-heading-id', `Duplicate heading id "${anchor}".`, element);
	}

	const content = compileInline<never>(element.childNodes, state, 'a heading', (node) => {
		if (node.tagName === 'agreement-clause') {
			addIssue(state, 'clause-outside-paragraph', 'Clauses must be directly inside a paragraph.', node);
		} else if (node.tagName === 'agreement-value') {
			addIssue(state, 'value-outside-clause', 'Values must be inside a clause.', node);
		} else {
			addIssue(
				state,
				'unsupported-inline-content',
				`<${node.tagName}> is not supported inside a heading.`,
				node
			);
		}
		return null;
	});
	if (state.issues.length === issueCount && !content.some((item) => item.value.trim())) {
		addIssue(state, 'empty-heading', 'Headings cannot be empty.', element);
	}

	if (state.issues.length !== issueCount || !anchor) return null;
	state.headingIds.add(anchor);
	return {
		type: 'heading',
		anchor,
		level: Number(element.tagName.slice(1)) as 1 | 2 | 3,
		content
	};
}

function compileParagraph(element: HtmlElement, state: CompileState): ParagraphNode | null {
	const issueCount = state.issues.length;
	const paragraphClauseIds = new Set<string>();
	readAttributes(element, NO_ATTRIBUTES, state);
	requireClosingTag(element, state);
	const content = compileInline<ClauseNode>(element.childNodes, state, 'a paragraph', (node, marks) => {
		if (node.tagName === 'agreement-clause') {
			if (marks.bold || marks.italic) {
				addIssue(state, 'formatted-clause', 'A clause cannot be wrapped in <strong> or <em>.', node);
				return null;
			}
			return compileClause(node, state, paragraphClauseIds);
		}
		if (node.tagName === 'agreement-value') {
			addIssue(state, 'value-outside-clause', 'Values must be inside a clause.', node);
		} else {
			addIssue(
				state,
				'unsupported-inline-content',
				`<${node.tagName}> is not supported inside a paragraph.`,
				node
			);
		}
		return null;
	});

	if (
		state.issues.length === issueCount &&
		!content.some((node) => node.type === 'clause' || Boolean(node.value.trim()))
	) {
		addIssue(state, 'empty-paragraph', 'Paragraphs cannot be empty.', element);
	}

	if (state.issues.length !== issueCount) return null;
	for (const clauseId of paragraphClauseIds) state.clauseIds.add(clauseId);
	return { type: 'paragraph', content };
}

function signatureParty(name: string): SignaturePartyNode {
	return {
		name,
		fields: [
			{ label: 'By', kind: 'signature-line' },
			{ label: 'Name', kind: 'text', value: '[Name]', marks: { bold: true } },
			{ label: 'Title', kind: 'text', value: '[Title]', marks: { bold: true } },
			{ label: 'Date', kind: 'text', value: '[Date]', marks: { bold: true } }
		]
	};
}

function compileSignatures(element: HtmlElement, state: CompileState): SignatureGridNode | null {
	const issueCount = state.issues.length;
	const attributes = readAttributes(element, SIGNATURE_ATTRIBUTES, state);
	requireClosingTag(element, state);

	if (!attributes.provider || !attributes.customer) {
		addIssue(
			state,
			'missing-signature-party',
			'<agreement-signatures> requires provider and customer attributes.',
			element
		);
	}
	if (element.childNodes.some((child) => !isText(child) || child.value.trim())) {
		addIssue(state, 'signature-content', '<agreement-signatures> must be empty.', element);
	}

	if (state.issues.length !== issueCount || !attributes.provider || !attributes.customer) {
		return null;
	}

	return {
		type: 'signature-grid',
		title: 'SIGNATURES',
		parties: [signatureParty(attributes.provider), signatureParty(attributes.customer)]
	};
}

function parseSource(source: string):
	| { ok: true; nodes: HtmlNode[] }
	| { ok: false; issues: AgreementSourceIssue[] } {
	const issues: AgreementSourceIssue[] = [];
	const fragment = parseFragment(source.replace(/^\uFEFF/u, ''), {
		sourceCodeLocationInfo: true,
		scriptingEnabled: false,
		onParseError(error: ParserError) {
			issues.push({
				code: `html-${error.code}`,
				message: 'The agreement contains malformed HTML near this location.',
				line: error.startLine,
				column: error.startCol
			});
		}
	});

	return issues.length
		? { ok: false, issues }
		: { ok: true, nodes: fragment.childNodes };
}

function validateChangesControl(
	clauseId: string,
	control: ChangesControlDefinition,
	state: CompileState
): void {
	const controlId = typeof control.id === 'string' ? control.id : '';
	if (!controlId || !SLUG.test(controlId)) {
		addIssue(
			state,
			'invalid-control-definition-id',
			`The control in clause "${clauseId}" must have a lowercase slug id.`
		);
	}

	if (typeof control.label !== 'string' || !control.label.trim()) {
		addIssue(state, 'missing-control-label', `Control "${clauseId}.${controlId}" must have a label.`);
	}

	const options = Array.isArray(control.options) ? control.options : [];
	const optionIds = options.map((option) => option?.value);
	const customOptions = options.filter((option) => option?.kind === 'custom');
	if (optionIds.length < 2) {
		addIssue(
			state,
			'missing-control-options',
			`Control "${clauseId}.${controlId}" must define at least two options.`
		);
	} else if (new Set(optionIds).size !== optionIds.length) {
		addIssue(
			state,
			'duplicate-control-option',
			`Control "${clauseId}.${controlId}" contains duplicate options.`
		);
	}

	for (const option of options) {
		if (!option || typeof option.value !== 'string' || !option.value.trim()) {
			addIssue(
				state,
				'invalid-control-option',
				`Control "${clauseId}.${controlId}" contains an empty option.`
			);
		}
		if (!option || typeof option.controlLabel !== 'string' || !option.controlLabel.trim()) {
			addIssue(
				state,
				'missing-control-option-label',
				`Every option for "${clauseId}.${controlId}" must have a control label.`
			);
		}
		if (!option || !['value', 'deactivate', 'custom'].includes(option.kind)) {
			addIssue(
				state,
				'invalid-control-option-kind',
				`Every option for "${clauseId}.${controlId}" must have a valid kind.`
			);
		}
		if (
			option?.kind !== 'custom' &&
			(typeof option?.documentLabel !== 'string' || !option.documentLabel.trim())
		) {
			addIssue(
				state,
				'missing-control-option-document-label',
				`Non-custom options for "${clauseId}.${controlId}" must have a document label.`
			);
		}
	}

	if (customOptions.length > 1) {
		addIssue(
			state,
			'multiple-custom-control-options',
			`Control "${clauseId}.${controlId}" can define at most one custom option.`
		);
	}

	if (typeof control.defaultValue !== 'string' || !optionIds.includes(control.defaultValue)) {
		addIssue(
			state,
			'invalid-default-value',
			`Default value "${control.defaultValue}" is not an option for "${clauseId}.${controlId}".`
		);
	} else if (customOptions.some((option) => option.value === control.defaultValue)) {
		addIssue(
			state,
			'invalid-custom-default-value',
			`The custom option cannot be the default for "${clauseId}.${controlId}".`
		);
	}
}

function validateDocumentValues(
	clauseId: string,
	clause: ClauseRegistry[string],
	state: CompileState
): void {
	for (const [valueId, value] of Object.entries(clause.values ?? {})) {
		if (!SLUG.test(valueId)) {
			addIssue(
				state,
				'invalid-value-definition-id',
				`Value id "${clauseId}.${valueId}" must be a lowercase slug.`
			);
		}
		if (!value || typeof value.defaultLabel !== 'string' || !value.defaultLabel.trim()) {
			addIssue(
				state,
				'missing-value-label',
				`Value "${clauseId}.${valueId}" must have a default label.`
			);
		}
	}
}

function validateClauses(clauses: ClauseRegistry, state: CompileState): void {
	if (!clauses || typeof clauses !== 'object') {
		addIssue(state, 'missing-clause-registry', 'The agreement must define its clauses.');
		return;
	}

	for (const [clauseId, clause] of Object.entries(clauses)) {
		if (!clause || typeof clause !== 'object') {
			addIssue(state, 'invalid-clause-definition', `Clause "${clauseId}" must be an object.`);
			continue;
		}
		if (!SLUG.test(clauseId)) {
			addIssue(
				state,
				'invalid-clause-definition-id',
				`Clause id "${clauseId}" must be a lowercase slug.`
			);
		}
		if (typeof clause.title !== 'string' || !clause.title.trim()) {
			addIssue(state, 'missing-clause-title', `Clause "${clauseId}" must have a title.`);
		}
		if (!CLAUSE_HIGHLIGHT_TONES.has(clause.highlightTone)) {
			addIssue(
				state,
				'invalid-clause-highlight-tone',
				`Clause "${clauseId}" has an unsupported highlight tone.`
			);
		}
		validateDocumentValues(clauseId, clause, state);
		if (!clause.widget || typeof clause.widget !== 'object') {
			addIssue(state, 'missing-clause-widget', `Clause "${clauseId}" must define a widget.`);
			continue;
		}
		const widget = clause.widget;
		if (widget.type !== 'changes' && widget.type !== 'faq') {
			addIssue(state, 'invalid-widget-type', `Clause "${clauseId}" has an unsupported widget type.`);
			continue;
		}

		if (widget.type === 'changes') {
			if (typeof widget.prompt !== 'string' || !widget.prompt.trim()) {
				addIssue(state, 'missing-changes-prompt', `Changes widget for clause "${clauseId}" must have a prompt.`);
			}
			if (typeof widget.appliedMessage !== 'string' || !widget.appliedMessage.trim()) {
				addIssue(
					state,
					'missing-changes-applied-message',
					`Changes widget for clause "${clauseId}" must have an applied message.`
				);
			}
			if (!widget.control || typeof widget.control !== 'object') {
				addIssue(
					state,
					'missing-changes-control',
					`Changes widget for clause "${clauseId}" must define one control.`
				);
			} else {
				validateChangesControl(clauseId, widget.control, state);
			}
			continue;
		}

		if (typeof widget.intro !== 'string' || !widget.intro.trim()) {
			addIssue(state, 'missing-faq-intro', `FAQ widget for clause "${clauseId}" must have introductory text.`);
		}
		if (!Array.isArray(widget.items) || widget.items.length === 0) {
			addIssue(state, 'missing-faq-items', `FAQ widget for clause "${clauseId}" must contain at least one item.`);
		}

		const itemIds = new Set<string>();
		for (const item of Array.isArray(widget.items) ? widget.items : []) {
			if (!item || typeof item !== 'object') {
				addIssue(state, 'invalid-faq-item', `Every item in FAQ widget for clause "${clauseId}" must be an object.`);
				continue;
			}
			const itemId = typeof item.id === 'string' ? item.id : '';
			if (!itemId || !SLUG.test(itemId)) {
				addIssue(
					state,
					'invalid-faq-item-id',
					`Every item in FAQ widget for clause "${clauseId}" must have a lowercase slug id.`
				);
			} else if (itemIds.has(itemId)) {
				addIssue(
					state,
					'duplicate-faq-item-id',
					`FAQ widget for clause "${clauseId}" contains duplicate item id "${itemId}".`
				);
			}
			if (itemId) itemIds.add(itemId);

			if (typeof item.question !== 'string' || !item.question.trim()) {
				addIssue(state, 'missing-faq-question', `FAQ item "${itemId}" must have a question.`);
			}
			if (!Array.isArray(item.answer) || item.answer.length === 0) {
				addIssue(state, 'missing-faq-answer', `FAQ item "${itemId}" must have an answer.`);
			}
			for (const paragraph of Array.isArray(item.answer) ? item.answer : []) {
				if (!paragraph || !Array.isArray(paragraph.parts) || paragraph.parts.length === 0) {
					addIssue(
						state,
						'missing-faq-answer-text',
						`Every answer paragraph in FAQ item "${itemId}" must contain text.`
					);
				}
				for (const part of paragraph && Array.isArray(paragraph.parts) ? paragraph.parts : []) {
					if (!part || (part.type !== 'text' && part.type !== 'clause-reference')) {
						addIssue(
							state,
							'invalid-faq-answer-part',
							`Every answer part in FAQ item "${itemId}" must be text or a clause reference.`
						);
						continue;
					}
					if (typeof part.text !== 'string' || !part.text.trim()) {
						addIssue(
							state,
							'missing-faq-answer-part-text',
							`Every answer part in FAQ item "${itemId}" must contain text.`
						);
					}
					if (part.type !== 'clause-reference') continue;
					if (typeof part.clauseId !== 'string' || !SLUG.test(part.clauseId)) {
						addIssue(
							state,
							'invalid-faq-clause-reference',
							`FAQ clause reference ids must be lowercase slugs.`
						);
					}
				}
			}
		}
	}
}

function validateDocumentShape(
	compiled: CompiledBlock[],
	state: CompileState
): string | null {
	const titles = compiled.filter(
		(item) => item.block.type === 'heading' && item.block.level === 1
	);
	if (titles.length !== 1) {
		addIssue(state, 'title-count', 'Agreement must contain exactly one level-one title.');
	} else {
		const title = titles[0];
		if (compiled[0] !== title) {
			addIssue(
				state,
				'title-position',
				'The level-one title must be the first document block.',
				title.source
			);
		}
	}

	const signatures = compiled.filter((item) => item.block.type === 'signature-grid');
	if (signatures.length !== 1) {
		addIssue(state, 'signature-count', 'Agreement must contain exactly one signature section.');
	} else if (compiled.at(-1) !== signatures[0]) {
		addIssue(
			state,
			'signature-position',
			'The signature section must be the final document block.',
			signatures[0].source
		);
	}

	const title = titles[0]?.block;
	return title?.type === 'heading' ? title.anchor : null;
}

function validateClauseReferences(
	clauses: ClauseRegistry,
	state: CompileState
): void {
	const missingClauseReferences = new Set<string>();

	for (const clauseId of state.clauseIds) {
		const clause = clauses[clauseId];
		if (!clause) {
			addIssue(
				state,
				'missing-clause-definition',
				`Clause "${clauseId}" must have a definition in clauses.ts.`
			);
			continue;
		}

		for (const valueId of Object.keys(clause.values ?? {})) {
			if (!state.clauseDocumentValueIds.get(clauseId)?.has(valueId)) {
				addIssue(
					state,
					'missing-clause-value',
					`Clause "${clauseId}" must contain <agreement-value id="${valueId}"></agreement-value>.`
				);
			}
		}

		if (
			clause.widget.type === 'changes' &&
			!clause.values?.[clause.widget.control.id]
		) {
			addIssue(
				state,
				'missing-control-value',
				`Changes control "${clauseId}.${clause.widget.control.id}" must have a matching document value.`
			);
		}
	}

	for (const [clauseId, clause] of Object.entries(clauses)) {
		if (!state.clauseIds.has(clauseId)) {
			addIssue(
				state,
				'unknown-clause-definition',
				`Clause definitions reference unknown clause "${clauseId}".`
			);
		}

		if (clause.widget.type !== 'faq') continue;
		for (const item of clause.widget.items) {
			for (const paragraph of item.answer) {
				for (const part of paragraph.parts) {
					if (
						part.type === 'clause-reference' &&
						!state.clauseIds.has(part.clauseId)
					) {
						missingClauseReferences.add(part.clauseId);
					}
				}
			}
		}
	}

	for (const clauseId of missingClauseReferences) {
		addIssue(
			state,
			'unknown-clause-reference',
			`Clause definitions reference unknown clause "${clauseId}".`
		);
	}
}

export function compileAgreementSource(
	source: string,
	clauses: ClauseRegistry
): AgreementCompileResult {
	const parsed = parseSource(source);
	if (!parsed.ok) return { ok: false, kind: 'source', issues: parsed.issues };

	const state: CompileState = {
		issues: [],
		clauseIds: new Set<string>(),
		clauseDocumentValueIds: new Map<string, Set<string>>(),
		headingIds: new Set<string>(),
		clauses
	};
	validateClauses(clauses, state);
	if (state.issues.length) return { ok: false, kind: 'source', issues: state.issues };

	const compiled: CompiledBlock[] = [];

	for (const node of parsed.nodes) {
		if (isText(node) && !node.value.trim()) continue;
		if (!isElement(node)) {
			addIssue(state, 'unsupported-document-content', 'Only agreement elements are allowed here.', node);
			continue;
		}

		let block: BlockNode | null = null;
		if (node.tagName === 'h1' || node.tagName === 'h2' || node.tagName === 'h3') {
			block = compileHeading(node, state);
		} else if (node.tagName === 'p') {
			block = compileParagraph(node, state);
		} else if (node.tagName === 'agreement-signatures') {
			block = compileSignatures(node, state);
		} else {
			addIssue(
				state,
				'unsupported-document-element',
				`<${node.tagName}> is not a supported agreement element.`,
				node
			);
		}

		if (block) compiled.push({ block, source: node });
	}

	if (state.issues.length) return { ok: false, kind: 'source', issues: state.issues };

	const agreementId = validateDocumentShape(compiled, state);
	if (state.issues.length) return { ok: false, kind: 'source', issues: state.issues };
	if (!agreementId) throw new Error('Validated agreement title is missing.');

	validateClauseReferences(clauses, state);
	if (state.issues.length) return { ok: false, kind: 'source', issues: state.issues };

	return {
		ok: true,
		agreement: {
			document: {
				id: agreementId,
				blocks: compiled.map((item) => item.block)
			},
			clauses
		}
	};
}
