import { mockRequest } from '../../hero/requests-demo/mock-requests.ts';
import type { GuidedTourStep } from '../demo/tour-model.ts';

export const acceptDemo = {
	requestId: 'notice-period',
	startingPoints: 10
} as const;

export const acceptRequest = mockRequest(acceptDemo.requestId);

export function acceptPointsLeft(accepted: boolean) {
	return acceptDemo.startingPoints - (accepted ? (acceptRequest.points ?? 0) : 0);
}

export type AcceptChangesPhase = 'rest' | 'approach-accept' | 'click-accept' | 'accepted' | 'hold';
export type AcceptChangesTarget = 'accept';

export interface AcceptChangesTourState {
	accepted: boolean;
}

export type AcceptChangesTourStep = GuidedTourStep<
	AcceptChangesPhase,
	AcceptChangesTourState,
	AcceptChangesTarget
>;

export const acceptChangesTour: ReadonlyArray<AcceptChangesTourStep> = [
	{ phase: 'rest', duration: 800, state: { accepted: false }, cursor: null },
	{
		phase: 'approach-accept',
		duration: 850,
		state: { accepted: false },
		cursor: { target: 'accept', mode: 'idle' }
	},
	{
		phase: 'click-accept',
		duration: 200,
		state: { accepted: false },
		cursor: { target: 'accept', mode: 'clicking' }
	},
	{
		phase: 'accepted',
		duration: 400,
		state: { accepted: true },
		cursor: { target: 'accept', mode: 'idle' }
	},
	{ phase: 'hold', duration: 2800, state: { accepted: true }, cursor: null }
];
