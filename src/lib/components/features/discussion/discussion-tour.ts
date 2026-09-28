import { mockRequest } from '../../hero/requests-demo/mock-requests.ts';
import type { GuidedTourStep } from '../demo/tour-model.ts';

export const discussionDemo = { requestId: 'unlimited-liability', questionId: 'concern' } as const;

const request = mockRequest(discussionDemo.requestId);
if (request.decision !== 'cannotAccept') {
	throw new Error('Discussion tour must use a request that cannot be accepted.');
}
export const discussionRequest = request;

export type DiscussionPhase =
	| 'rest'
	| 'approach-discuss'
	| 'click-discuss'
	| 'panel-open'
	| 'approach-question'
	| 'click-question'
	| 'expanded'
	| 'hold';
export type DiscussionTarget = 'discuss' | 'question';

export interface DiscussionTourState {
	panelOpen: boolean;
	questionOpen: boolean;
}

export type DiscussionTourStep = GuidedTourStep<DiscussionPhase, DiscussionTourState, DiscussionTarget>;

const review = { panelOpen: false, questionOpen: false } as const;
const panel = { panelOpen: true, questionOpen: false } as const;
const expanded = { panelOpen: true, questionOpen: true } as const;

export const discussionTour: ReadonlyArray<DiscussionTourStep> = [
	{ phase: 'rest', duration: 800, state: review, cursor: null },
	{
		phase: 'approach-discuss',
		duration: 850,
		state: review,
		cursor: { target: 'discuss', mode: 'idle' }
	},
	{
		phase: 'click-discuss',
		duration: 200,
		state: review,
		cursor: { target: 'discuss', mode: 'clicking' }
	},
	{ phase: 'panel-open', duration: 850, state: panel, cursor: null },
	{
		phase: 'approach-question',
		duration: 750,
		state: panel,
		cursor: { target: 'question', mode: 'idle' }
	},
	{
		phase: 'click-question',
		duration: 200,
		state: panel,
		cursor: { target: 'question', mode: 'clicking' }
	},
	{ phase: 'expanded', duration: 500, state: expanded, cursor: { target: 'question', mode: 'idle' } },
	{ phase: 'hold', duration: 3400, state: expanded, cursor: null }
];
