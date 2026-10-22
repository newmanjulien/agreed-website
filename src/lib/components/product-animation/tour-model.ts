export const motionTiming = { paper: 450, guidance: 180, panel: 600, cursorFade: 120, click: 220, loopFade: 250 } as const;
export type GuidedCursorMode = 'idle' | 'clicking';
export interface GuidedTourStep<Phase extends string = string, State = unknown, Target = unknown> {
	phase: Phase;
	duration: number;
	state: State;
	cursor: { target: Target; mode: GuidedCursorMode; move?: number; fade?: number } | null;
	motion?: { document?: number; paper?: number; guidance?: number; panel?: number; opacity?: number; cursorOpacity?: number };
}

/** The clock only needs frames while a declared visual cue is moving. */
export function motionDuration(step: GuidedTourStep): number {
	return Math.max(0, ...Object.values(step.motion ?? {}), step.cursor?.move ?? 0,
		step.cursor?.fade ?? 0, step.cursor?.mode === 'clicking' ? motionTiming.click : 0);
}
