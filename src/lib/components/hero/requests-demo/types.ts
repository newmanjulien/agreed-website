export type ChangeRequestType = 'Can accept' | 'Needs approval' | "Can't accept";

export type ChangeRequestAction = 'Add' | 'See more' | 'Accept';

export type ChangeRequest = {
	id: string;
	requestedChange: string;
	type: ChangeRequestType;
	action: ChangeRequestAction;
	points?: number;
};
