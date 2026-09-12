import type { DiscussionMessage } from '$lib/demo/document/discussions/types';

export type AnnotationKind = 'comment' | 'change';

export interface TextAnchorSegment {
	blockId: string;
	start: number;
	end: number;
	quote: string;
}

export interface TextAnchor {
	segments: TextAnchorSegment[];
}

export interface DocumentAnnotation extends DiscussionMessage {
	kind: AnnotationKind;
	anchor: TextAnchor;
}

export interface AnnotationComposerState {
	kind: AnnotationKind;
	anchor: TextAnchor;
	text: string;
}
