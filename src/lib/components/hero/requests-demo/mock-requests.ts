import type { ChangeRequest } from './types';

export function mockRequest(id: string): ChangeRequest {
	const request = mockRequests.find((item) => item.id === id);
	if (!request) throw new Error(`Unknown mock request "${id}".`);
	return request;
}

export const mockRequests: ChangeRequest[] = [
	{
		id: 'notice-period',
		requestedChange: 'Add a 10-day notice period before suspending service for non-payment',
		type: 'Can accept',
		action: 'Accept',
		points: 3
	},
	{
		id: 'liability-cap',
		requestedChange: 'Increase the liability cap from 1x to 2x fees paid under the MSA',
		type: 'Needs approval',
		action: 'Add'
	},
	{
		id: 'unlimited-liability',
		requestedChange: 'Require unlimited liability for all breaches of the MSA',
		type: "Can't accept",
		action: 'See more'
	},
	{
		id: 'cure-period',
		requestedChange: 'Add a 30-day cure period before termination for material breach',
		type: 'Can accept',
		action: 'Accept',
		points: 1
	}
];
