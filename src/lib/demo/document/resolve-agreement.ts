import type {
	AgreementClauseProposals,
	AgreementControlValues
} from './agreement-control-values.ts';
import type {
	ChangesControlDefinition,
	ChangesControlOption,
	ClauseRegistry
} from './agreement-model.ts';
import type {
	AgreementDocument,
	HeadingNode,
	ParagraphContentNode,
	ParagraphNode,
	SignatureGridNode,
	TextNode
} from './types.ts';

export interface ResolvedAgreementDocument {
	id: string;
	blocks: ResolvedBlockNode[];
}

export type ResolvedBlockNode =
	| ResolvedHeadingNode
	| ResolvedParagraphNode
	| SignatureGridNode;

export interface ResolvedHeadingNode extends Omit<HeadingNode, 'content'> {
	content: TextNode[];
}

export interface ResolvedParagraphNode extends Omit<ParagraphNode, 'content'> {
	content: ResolvedInlineNode[];
}

export type ResolvedInlineNode = TextNode | ResolvedClauseNode;

export interface ResolvedClauseNode {
	type: 'clause';
	id: string;
	content: TextNode[];
	isClauseInactive?: boolean;
	proposalText?: string;
}

function cloneText(node: TextNode): TextNode {
	return {
		type: 'text',
		value: node.value,
		...(node.marks ? { marks: { ...node.marks } } : {})
	};
}

function cloneSignatureParty(party: SignatureGridNode['parties'][number]) {
	return {
		...party,
		fields: party.fields.map((field) => ({
			...field,
			...(field.marks ? { marks: { ...field.marks } } : {})
		}))
	};
}

function resolveSelectedControlOption(
	control: ChangesControlDefinition,
	controlValues: Readonly<AgreementControlValues>,
	clauseId: string
): ChangesControlOption {
	const selectedValue = controlValues[clauseId]?.[control.id] ?? control.defaultValue;
	const selectedOption = control.options.find((option) => option.value === selectedValue);
	if (!selectedOption) {
		throw new Error(`Invalid selected value for "${clauseId}.${control.id}".`);
	}
	return selectedOption;
}

function resolveClauseValue(
	clauses: ClauseRegistry,
	controlValues: Readonly<AgreementControlValues>,
	clauseId: string,
	valueId: string
): string {
	const clause = clauses[clauseId];
	const definition = clause?.values?.[valueId];
	if (!clause || !definition) {
		throw new Error(`Missing displayed value for "${clauseId}.${valueId}".`);
	}

	if (clause.widget.type !== 'changes' || clause.widget.control.id !== valueId) {
		return definition.defaultLabel;
	}

	const selectedOption = resolveSelectedControlOption(
		clause.widget.control,
		controlValues,
		clauseId
	);
	return selectedOption.kind === 'custom'
		? definition.defaultLabel
		: selectedOption.documentLabel;
}

export function resolveAgreement(
	template: AgreementDocument,
	clauses: ClauseRegistry,
	controlValues: Readonly<AgreementControlValues>,
	clauseProposals: Readonly<AgreementClauseProposals> = {}
): ResolvedAgreementDocument {
	return {
		id: template.id,
		blocks: template.blocks.map((block): ResolvedBlockNode => {
			if (block.type === 'signature-grid') {
				return {
					...block,
					parties: [
						cloneSignatureParty(block.parties[0]),
						cloneSignatureParty(block.parties[1])
					]
				};
			}

			if (block.type === 'heading') {
				return { ...block, content: block.content.map(cloneText) };
			}

			return {
				...block,
				content: block.content.map((node: ParagraphContentNode): ResolvedInlineNode => {
					if (node.type === 'text') return cloneText(node);
					const clause = clauses[node.id];
					const selectedOption =
						clause?.widget.type === 'changes'
							? resolveSelectedControlOption(clause.widget.control, controlValues, node.id)
							: undefined;
					const proposalText =
						selectedOption?.kind === 'custom'
							? clauseProposals[node.id]?.text
							: undefined;
					return {
						type: 'clause',
						id: node.id,
						...(selectedOption?.kind === 'deactivate' || proposalText
							? { isClauseInactive: true }
							: {}),
						...(proposalText ? { proposalText } : {}),
						content: node.content.map((child): TextNode =>
							child.type === 'text'
								? cloneText(child)
								: {
										type: 'text',
										value: resolveClauseValue(clauses, controlValues, node.id, child.id),
										...(child.marks ? { marks: { ...child.marks } } : {})
									}
						)
					};
				})
			};
		})
	};
}

export function getAgreementTitle(
	document: AgreementDocument | ResolvedAgreementDocument
): string {
	const title = document.blocks.find(
		(block) => block.type === 'heading' && block.level === 1
	);
	if (!title || title.type !== 'heading') throw new Error('Agreement title is missing.');
	return title.content.map((node) => node.value).join('');
}
