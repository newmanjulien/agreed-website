import { mockRequest } from '../../hero/requests-demo/mock-requests.ts';
import type { GuidedTourStep } from '../demo/tour-model.ts';

export const approvalDemo = {
	requestId: 'liability-cap',
	explanation:
		"Had a call with their GC this morning. They said they cannot sign at 1x because their insurance requires a 2x liability cap on every MSA, and they cannot get an exception. We've approved 2x on the last three enterprise deals."
} as const;

export const approvalRequest = mockRequest(approvalDemo.requestId);

export type ApprovalPhase =
	| 'rest'
	| 'approach-add'
	| 'click-add'
	| 'bag-empty'
	| 'typing'
	| 'hold';
export type ApprovalTarget = 'add';
export type ApprovalScreen = 'review' | 'bag';

export interface ApprovalTourState {
	screen: ApprovalScreen;
	typedProgress: number;
}

export type ApprovalTourStep = GuidedTourStep<ApprovalPhase, ApprovalTourState, ApprovalTarget>;

export function approvalTypedText(progress: number) {
	return approvalDemo.explanation.slice(
		0,
		Math.round(approvalDemo.explanation.length * progress)
	);
}

const review = { screen: 'review', typedProgress: 0 } as const;
const bagEmpty = { screen: 'bag', typedProgress: 0 } as const;
const bagFilled = { screen: 'bag', typedProgress: 1 } as const;

export const approvalTour: ReadonlyArray<ApprovalTourStep> = [
	{ phase: 'rest', duration: 800, state: review, cursor: null },
	{
		phase: 'approach-add',
		duration: 850,
		state: review,
		cursor: { target: 'add', mode: 'idle' }
	},
	{
		phase: 'click-add',
		duration: 200,
		state: review,
		cursor: { target: 'add', mode: 'clicking' }
	},
	{ phase: 'bag-empty', duration: 600, state: bagEmpty, cursor: null },
	{
		phase: 'typing',
		duration: 4600,
		state: bagEmpty,
		cursor: null,
		trackProgress: true
	},
	{ phase: 'hold', duration: 3400, state: bagFilled, cursor: null }
];
