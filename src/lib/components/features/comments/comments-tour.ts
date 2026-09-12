import type { GuidedTourStep } from '../demo/tour-model.ts';

export type CommentsPhase =
	| 'rest'
	| 'approach-selection'
	| 'press-selection'
	| 'drag-selection'
	| 'selection-complete'
	| 'approach-comment'
	| 'click-comment'
	| 'composer-empty'
	| 'composer-filled'
	| 'approach-submit'
	| 'click-submit'
	| 'submitted';

export type CommentsTarget = 'selection' | 'comment-action' | 'submit';
export type CommentsView = 'document' | 'selection' | 'composer-empty' | 'composer-filled' | 'submitted';
export type SelectionPhase = 'none' | 'dragging' | 'complete';

export interface CommentsTourState {
	view: CommentsView;
	selection: SelectionPhase;
}

export type CommentsTourStep = GuidedTourStep<
	CommentsPhase,
	CommentsTourState,
	CommentsTarget
>;

export const commentSelectionTiming = {
	drag: 1100,
	wrap: 90
} as const;

export const commentsTour: ReadonlyArray<CommentsTourStep> = [
	{ phase: 'rest', duration: 650, state: { view: 'document', selection: 'none' }, cursor: null },
	{ phase: 'approach-selection', duration: 850, state: { view: 'document', selection: 'none' }, cursor: { target: 'selection', mode: 'idle' } },
	{ phase: 'press-selection', duration: 160, state: { view: 'document', selection: 'none' }, cursor: { target: 'selection', mode: 'pressed' } },
	{ phase: 'drag-selection', duration: commentSelectionTiming.drag, state: { view: 'document', selection: 'dragging' }, cursor: { target: 'selection', mode: 'dragging' }, trackProgress: true },
	{ phase: 'selection-complete', duration: 300, state: { view: 'selection', selection: 'complete' }, cursor: { target: 'selection', mode: 'idle' } },
	{ phase: 'approach-comment', duration: 650, state: { view: 'selection', selection: 'complete' }, cursor: { target: 'comment-action', mode: 'idle' } },
	{ phase: 'click-comment', duration: 200, state: { view: 'selection', selection: 'complete' }, cursor: { target: 'comment-action', mode: 'clicking' } },
	{ phase: 'composer-empty', duration: 600, state: { view: 'composer-empty', selection: 'complete' }, cursor: null },
	{ phase: 'composer-filled', duration: 650, state: { view: 'composer-filled', selection: 'complete' }, cursor: null },
	{ phase: 'approach-submit', duration: 600, state: { view: 'composer-filled', selection: 'complete' }, cursor: { target: 'submit', mode: 'idle' } },
	{ phase: 'click-submit', duration: 200, state: { view: 'composer-filled', selection: 'complete' }, cursor: { target: 'submit', mode: 'clicking' } },
	{ phase: 'submitted', duration: 2600, state: { view: 'submitted', selection: 'complete' }, cursor: null }
];
