import type { SignatureGridNode, TextNode } from '../types';

export interface InlineToken extends TextNode {
	type: 'text';
	clauseId?: string;
	isClauseInactive?: boolean;
	isClauseStart?: boolean;
}

export type PageFragment = HeadingFragment | ParagraphFragment | SignatureFragment;

export interface HeadingFragment {
	type: 'heading';
	blockKey: string;
	anchor: string;
	level: 1 | 2 | 3;
	tokens: InlineToken[];
}

export interface ParagraphFragment {
	type: 'paragraph';
	blockKey: string;
	tokens: InlineToken[];
	isContinuation: boolean;
	isFinal: boolean;
}

export interface SignatureFragment extends SignatureGridNode {
	type: 'signature-grid';
	blockKey: string;
}

export interface PageLayout {
	number: number;
	fragments: PageFragment[];
}
