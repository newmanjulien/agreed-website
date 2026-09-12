import type {
	ClauseContentNode,
	ClauseNode,
	HeadingNode,
	ParagraphContentNode,
	ParagraphNode,
	TextNode,
	ValueNode
} from '$lib/demo/document/types';
import type {
	ChangesWidgetDefinition,
	ClauseDefinition,
	CompiledAgreement,
	FaqWidgetDefinition
} from '$lib/demo/document/agreement-model';

export interface FeaturePreviewTextNode extends TextNode {
	cursorTarget?: true;
}

export type FeaturePreviewClauseContentNode = FeaturePreviewTextNode | ValueNode;

export interface FeaturePreviewClauseNode extends Omit<ClauseNode, 'content'> {
	content: FeaturePreviewClauseContentNode[];
}

export type FeaturePreviewParagraphContentNode =
	| FeaturePreviewTextNode
	| FeaturePreviewClauseNode;

export interface FeaturePreviewParagraph extends Omit<ParagraphNode, 'content'> {
	content: FeaturePreviewParagraphContentNode[];
}

export interface AgreementFeaturePreviewContent {
	heading: HeadingNode;
	paragraphsBeforeClause: FeaturePreviewParagraph[];
	clauseParagraph: FeaturePreviewParagraph;
	pricingHeading: HeadingNode;
	paragraphsAfterClause: FeaturePreviewParagraph[];
	clause: ClauseDefinition & { widget: FaqWidgetDefinition };
}

export interface FlagFeaturePreviewContent {
	heading: HeadingNode;
	paragraphsBeforeClause: FeaturePreviewParagraph[];
	clauseParagraph: FeaturePreviewParagraph;
	paragraphsAfterClause: FeaturePreviewParagraph[];
	clause: ClauseDefinition & { widget: ChangesWidgetDefinition };
}

export interface SelectionParagraphPreview {
	before: TextNode[];
	selection: TextNode[];
	after: TextNode[];
}

export interface CommentsFeaturePreviewContent {
	heading: HeadingNode;
	paragraphsBeforeSelection: ParagraphNode[];
	selectionParagraph: SelectionParagraphPreview;
	paragraphsAfterSelection: ParagraphNode[];
}

export interface FeaturePreviewContent {
	flag: FlagFeaturePreviewContent;
	nonNegotiable: AgreementFeaturePreviewContent;
	comments: CommentsFeaturePreviewContent;
}

const ROOT_ANCHOR = 'agreed-street-talk-agreement';
const PRICING_ANCHOR = 'pricing';
const SECURITY_ANCHOR = 'security';
const DATA_OWNERSHIP_CLAUSE_ID = 'data-ownership';
const RESEARCH_INTRODUCTIONS_CLAUSE_ID = 'research-introductions';
const FLAG_CURSOR_TEXT = 'two introductions';
const NON_NEGOTIABLE_CURSOR_TEXT = 'Street Talk data';
const COMMENT_SELECTION_TEXT = 'standalone version of the software';

function fail(message: string): never {
	throw new Error(`Feature preview content is invalid: ${message}`);
}

function headingIndex(agreement: CompiledAgreement, anchor: string): number {
	const index = agreement.document.blocks.findIndex(
		(block) => block.type === 'heading' && block.anchor === anchor
	);
	if (index < 0) fail(`missing heading anchor "${anchor}".`);
	return index;
}

function headingAt(agreement: CompiledAgreement, anchor: string): HeadingNode {
	const block = agreement.document.blocks[headingIndex(agreement, anchor)];
	if (!block || block.type !== 'heading') fail(`missing heading anchor "${anchor}".`);
	return block;
}

function sectionParagraphs(agreement: CompiledAgreement, anchor: string): ParagraphNode[] {
	const start = headingIndex(agreement, anchor);
	const paragraphs: ParagraphNode[] = [];
	for (const block of agreement.document.blocks.slice(start + 1)) {
		if (block.type === 'heading') break;
		if (block.type === 'paragraph') paragraphs.push(block);
	}
	return paragraphs;
}

function paragraphWithClause(
	agreement: CompiledAgreement,
	clauseId: string
): { paragraph: ParagraphNode; index: number } {
	for (const [index, block] of agreement.document.blocks.entries()) {
		if (
			block.type === 'paragraph' &&
			block.content.some((node) => node.type === 'clause' && node.id === clauseId)
		) {
			return { paragraph: block, index };
		}
	}
	fail(`missing clause "${clauseId}".`);
}

function requireClauseDefinition(
	agreement: CompiledAgreement,
	clauseId: string
): ClauseDefinition {
	return agreement.clauses[clauseId] ?? fail(`missing definition for clause "${clauseId}".`);
}

function markCursorTargetInNodes(
	nodes: ReadonlyArray<ClauseContentNode>,
	selection: string,
	context: string
): FeaturePreviewClauseContentNode[] {
	let matches = 0;
	const output: FeaturePreviewClauseContentNode[] = [];

	for (const node of nodes) {
		if (node.type === 'value') {
			output.push(node);
			continue;
		}

		let offset = 0;
		let match = node.value.indexOf(selection, offset);
		while (match >= 0) {
			if (match > offset) output.push({ ...node, value: node.value.slice(offset, match) });
			output.push({
				...node,
				value: selection,
				cursorTarget: true
			});
			matches += 1;
			offset = match + selection.length;
			match = node.value.indexOf(selection, offset);
		}
		if (offset < node.value.length) output.push({ ...node, value: node.value.slice(offset) });
	}

	if (matches !== 1) {
		fail(
			`${context} must contain selection text "${selection}" exactly once; found ${matches}.`
		);
	}
	return output;
}

function markClauseCursorTarget(
	paragraph: ParagraphNode,
	clauseId: string,
	selection: string
): FeaturePreviewParagraph {
	let matches = 0;
	const content: FeaturePreviewParagraphContentNode[] = paragraph.content.map((node) => {
		if (node.type !== 'clause' || node.id !== clauseId) return node;
		matches += 1;
		return {
			...node,
			content: markCursorTargetInNodes(node.content, selection, `clause "${clauseId}"`)
		};
	});
	if (matches !== 1) fail(`expected one "${clauseId}" clause in its preview paragraph.`);
	return { ...paragraph, content };
}

function copyParagraph(paragraph: ParagraphNode): FeaturePreviewParagraph {
	return {
		...paragraph,
		content: paragraph.content.map((node) =>
			node.type === 'clause' ? { ...node, content: [...node.content] } : node
		)
	};
}

function paragraphTextNodes(paragraph: ParagraphNode, context: string): TextNode[] {
	if (paragraph.content.some((node) => node.type !== 'text')) {
		fail(`${context} must contain ordinary text only.`);
	}
	return paragraph.content as TextNode[];
}

function splitTextNodes(
	nodes: ReadonlyArray<TextNode>,
	selection: string,
	context: string
): SelectionParagraphPreview {
	const fullText = nodes.map((node) => node.value).join('');
	const start = fullText.indexOf(selection);
	const secondMatch = start < 0 ? -1 : fullText.indexOf(selection, start + selection.length);
	if (start < 0 || secondMatch >= 0) {
		fail(
			`${context} must contain selection text "${selection}" exactly once; found ${start < 0 ? 0 : 2}.`
		);
	}

	const ranges: Array<{ start: number; end: number; output: TextNode[] }> = [
		{ start: 0, end: start, output: [] },
		{ start, end: start + selection.length, output: [] },
		{ start: start + selection.length, end: fullText.length, output: [] }
	];
	let nodeStart = 0;
	for (const node of nodes) {
		const nodeEnd = nodeStart + node.value.length;
		for (const range of ranges) {
			const sliceStart = Math.max(nodeStart, range.start);
			const sliceEnd = Math.min(nodeEnd, range.end);
			if (sliceEnd > sliceStart) {
				range.output.push({
					...node,
					value: node.value.slice(sliceStart - nodeStart, sliceEnd - nodeStart)
				});
			}
		}
		nodeStart = nodeEnd;
	}

	return {
		before: ranges[0].output,
		selection: ranges[1].output,
		after: ranges[2].output
	};
}

function createFlagContent(agreement: CompiledAgreement): FlagFeaturePreviewContent {
	const heading = headingAt(agreement, PRICING_ANCHOR);
	const section = sectionParagraphs(agreement, PRICING_ANCHOR);
	const clauseIndex = section.findIndex((paragraph) =>
		paragraph.content.some(
			(node) => node.type === 'clause' && node.id === RESEARCH_INTRODUCTIONS_CLAUSE_ID
		)
	);
	if (clauseIndex < 0) {
		fail(`clause "${RESEARCH_INTRODUCTIONS_CLAUSE_ID}" is not in section "${PRICING_ANCHOR}".`);
	}
	const clauseDefinition = requireClauseDefinition(agreement, RESEARCH_INTRODUCTIONS_CLAUSE_ID);
	if (clauseDefinition.widget.type !== 'changes') {
		fail(`clause "${RESEARCH_INTRODUCTIONS_CLAUSE_ID}" must use a changes widget.`);
	}
	const clauseParagraph = section[clauseIndex];
	if (!clauseParagraph) fail(`missing paragraph for clause "${RESEARCH_INTRODUCTIONS_CLAUSE_ID}".`);

	return {
		heading,
		paragraphsBeforeClause: section.slice(0, clauseIndex).map(copyParagraph),
		clauseParagraph: markClauseCursorTarget(
			clauseParagraph,
			RESEARCH_INTRODUCTIONS_CLAUSE_ID,
			FLAG_CURSOR_TEXT
		),
		paragraphsAfterClause: section.slice(clauseIndex + 1).map(copyParagraph),
		clause: { ...clauseDefinition, widget: clauseDefinition.widget }
	};
}

function createNonNegotiableContent(
	agreement: CompiledAgreement
): AgreementFeaturePreviewContent {
	const heading = headingAt(agreement, ROOT_ANCHOR);
	const { paragraph: clauseParagraph, index: clauseBlockIndex } = paragraphWithClause(
		agreement,
		DATA_OWNERSHIP_CLAUSE_ID
	);
	const headingBlockIndex = headingIndex(agreement, ROOT_ANCHOR);
	const beforeClause = agreement.document.blocks
		.slice(headingBlockIndex + 1, clauseBlockIndex)
		.filter((block): block is ParagraphNode => block.type === 'paragraph');
	const firstIntroParagraph = beforeClause[0];
	if (!firstIntroParagraph) fail(`section "${ROOT_ANCHOR}" must contain an introductory paragraph.`);

	const pricingParagraph = sectionParagraphs(agreement, PRICING_ANCHOR)[0];
	if (!pricingParagraph) fail(`section "${PRICING_ANCHOR}" must contain a paragraph.`);
	const clauseDefinition = requireClauseDefinition(agreement, DATA_OWNERSHIP_CLAUSE_ID);
	if (clauseDefinition.widget.type !== 'faq') {
		fail(`clause "${DATA_OWNERSHIP_CLAUSE_ID}" must use an FAQ widget.`);
	}

	return {
		heading,
		paragraphsBeforeClause: [copyParagraph(firstIntroParagraph)],
		clauseParagraph: markClauseCursorTarget(
			clauseParagraph,
			DATA_OWNERSHIP_CLAUSE_ID,
			NON_NEGOTIABLE_CURSOR_TEXT
		),
		pricingHeading: headingAt(agreement, PRICING_ANCHOR),
		paragraphsAfterClause: [copyParagraph(pricingParagraph)],
		clause: { ...clauseDefinition, widget: clauseDefinition.widget }
	};
}

function createCommentsContent(agreement: CompiledAgreement): CommentsFeaturePreviewContent {
	const heading = headingAt(agreement, SECURITY_ANCHOR);
	const section = sectionParagraphs(agreement, SECURITY_ANCHOR);
	const selectionParagraphIndex = section.findIndex((paragraph) =>
		paragraph.content.some(
			(node) => node.type === 'text' && node.value.includes(COMMENT_SELECTION_TEXT)
		)
	);
	if (selectionParagraphIndex < 0) {
		fail(
			`section "${SECURITY_ANCHOR}" is missing selection text "${COMMENT_SELECTION_TEXT}".`
		);
	}
	const selectionParagraph = section[selectionParagraphIndex];
	if (!selectionParagraph) fail(`section "${SECURITY_ANCHOR}" is missing its selection paragraph.`);

	// The compact excerpt intentionally skips the data-retention paragraph that precedes
	// the selected security term, matching the approved demo composition.
	const paragraphsBeforeSelection = section.slice(0, Math.min(2, selectionParagraphIndex));

	return {
		heading,
		paragraphsBeforeSelection,
		selectionParagraph: splitTextNodes(
			paragraphTextNodes(selectionParagraph, `the selected paragraph in section "${SECURITY_ANCHOR}"`),
			COMMENT_SELECTION_TEXT,
			`section "${SECURITY_ANCHOR}"`
		),
		paragraphsAfterSelection: section.slice(selectionParagraphIndex + 1)
	};
}

export function createFeaturePreviewContent(
	agreement: CompiledAgreement
): FeaturePreviewContent {
	return {
		flag: createFlagContent(agreement),
		nonNegotiable: createNonNegotiableContent(agreement),
		comments: createCommentsContent(agreement)
	};
}
