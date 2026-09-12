import type { GuidedTourStep } from '../demo/tour-model.ts';

export type FlagChangesPhase =
	| 'rest'
	| 'approach-clause'
	| 'click-clause'
	| 'panel-open'
	| 'approach-control'
	| 'click-control'
	| 'menu-open'
	| 'approach-option'
	| 'click-option'
	| 'changed';

export type FlagChangesTarget = 'clause' | 'select-trigger' | 'replacement-option';

export interface FlagChangesTourState {
	panelOpen: boolean;
	menuOpen: boolean;
	selected: boolean;
}

export type FlagChangesTourStep = GuidedTourStep<
	FlagChangesPhase,
	FlagChangesTourState,
	FlagChangesTarget
>;

export const flagChangesTour: ReadonlyArray<FlagChangesTourStep> = [
	{ phase: 'rest', duration: 650, state: { panelOpen: false, menuOpen: false, selected: false }, cursor: null },
	{ phase: 'approach-clause', duration: 850, state: { panelOpen: false, menuOpen: false, selected: false }, cursor: { target: 'clause', mode: 'idle' } },
	{ phase: 'click-clause', duration: 200, state: { panelOpen: false, menuOpen: false, selected: false }, cursor: { target: 'clause', mode: 'clicking' } },
	{ phase: 'panel-open', duration: 600, state: { panelOpen: true, menuOpen: false, selected: false }, cursor: { target: 'clause', mode: 'idle' } },
	{ phase: 'approach-control', duration: 650, state: { panelOpen: true, menuOpen: false, selected: false }, cursor: { target: 'select-trigger', mode: 'idle' } },
	{ phase: 'click-control', duration: 200, state: { panelOpen: true, menuOpen: false, selected: false }, cursor: { target: 'select-trigger', mode: 'clicking' } },
	{ phase: 'menu-open', duration: 400, state: { panelOpen: true, menuOpen: true, selected: false }, cursor: { target: 'select-trigger', mode: 'idle' } },
	{ phase: 'approach-option', duration: 650, state: { panelOpen: true, menuOpen: true, selected: false }, cursor: { target: 'replacement-option', mode: 'idle' } },
	{ phase: 'click-option', duration: 200, state: { panelOpen: true, menuOpen: true, selected: false }, cursor: { target: 'replacement-option', mode: 'clicking' } },
	{ phase: 'changed', duration: 2300, state: { panelOpen: true, menuOpen: false, selected: true }, cursor: null }
];
