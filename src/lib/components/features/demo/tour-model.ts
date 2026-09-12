export type GuidedCursorMode = 'idle' | 'clicking' | 'pressed' | 'dragging';

export interface ScenePoint {
	x: number;
	y: number;
}

export type GuidedCursorDestination =
	| { kind: 'element'; element: Element }
	| { kind: 'point'; point: ScenePoint };

export interface GuidedCursorState<Target extends string> {
	target: Target;
	mode: GuidedCursorMode;
}

export interface GuidedTourStep<
	Phase extends string = string,
	State = unknown,
	Target extends string = string
> {
	phase: Phase;
	duration: number;
	state: State;
	cursor: GuidedCursorState<Target> | null;
	trackProgress?: boolean;
}
