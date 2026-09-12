export interface AgreementDocument {
	id: string;
	blocks: BlockNode[];
}

export type BlockNode = HeadingNode | ParagraphNode | SignatureGridNode;

export interface HeadingNode {
	type: 'heading';
	anchor: string;
	level: 1 | 2 | 3;
	content: TextNode[];
}

export interface ParagraphNode {
	type: 'paragraph';
	content: ParagraphContentNode[];
}

export interface SignatureGridNode {
	type: 'signature-grid';
	title: string;
	parties: [SignaturePartyNode, SignaturePartyNode];
}

export interface SignaturePartyNode {
	name: string;
	fields: SignatureFieldNode[];
}

export interface SignatureFieldNode {
	label: string;
	kind: 'signature-line' | 'text';
	value?: string;
	marks?: TextMarks;
}

export type ParagraphContentNode = TextNode | ClauseNode;

export type ClauseContentNode = TextNode | ValueNode;

export interface TextNode {
	type: 'text';
	value: string;
	marks?: TextMarks;
}

export interface TextMarks {
	bold?: boolean;
	italic?: boolean;
}

export interface ClauseNode {
	type: 'clause';
	id: string;
	content: ClauseContentNode[];
}

export interface ValueNode {
	type: 'value';
	id: string;
	marks?: TextMarks;
}
