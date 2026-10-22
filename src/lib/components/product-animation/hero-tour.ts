import { defineTour, cursorMoveDuration, type AnimationState, type AnimationStep, type AnimationTarget } from './model.ts';

const steps: AnimationStep[] = [];
let state: AnimationState = { clause: 'demo:resale', contract: 'baseline', viewport: 'top' };
function hold(phase: string, duration: number, target: AnimationTarget | null = null, mode: 'idle' | 'clicking' = 'idle', move?: number) {
	steps.push({ phase, duration, state: { ...state }, cursor: target ? { target, mode, ...(move ? { move } : {}) } : null });
}
function click(name: string, target: AnimationTarget) {
	hold(`${name}-approach`, cursorMoveDuration, target, 'idle', cursorMoveDuration);
	hold(`${name}-click`, 220, target, 'clicking');
}
function openBox(name: string, summaryDuration: number, enterDuration = 120) {
	hold(`${name}-enter`, enterDuration, { kind: 'origin' });
	hold(`${name}-approach`, cursorMoveDuration, { kind: 'clause', clause: state.clause }, 'idle', cursorMoveDuration);
	state = { ...state, hovered: true };
	hold(`${name}-hover`, 220, { kind: 'clause', clause: state.clause });
	hold(`${name}-click`, 220, { kind: 'clause', clause: state.clause }, 'clicking');
	state = { ...state, box: { clause: state.clause, section: null, scroll: 'start' }, hovered: false };
	hold(`${name}-summary`, summaryDuration, { kind: 'clause', clause: state.clause });
}
function travel(name: string, clause: string, duration: number) {
	state = { ...state, clause, viewport: 'clause', hovered: false };
	hold(`${name}-travel`, duration, { kind: 'origin' }, 'idle', cursorMoveDuration);
}
function advice(name: string, section: string, duration: number) {
	click(name, { kind: 'section', clause: state.box!.clause, section });
	state = { ...state, box: { ...state.box!, section, scroll: 'start' } };
	hold(`${name}-read`, duration, { kind: 'section', clause: state.box!.clause, section });
}
function concede(name: string, contract: AnimationState['contract'], concession: string, reading: number, redline: number) {
	advice(`${name}-preferred`, 'preferred', reading);
	const target: AnimationTarget = { kind: 'concession', clause: state.box!.clause, concession };
	click(`${name}-apply`, target);
	state = { ...state, contract };
	hold(`${name}-applied`, 600, target);
	state = { ...state, viewport: 'revision' };
	hold(`${name}-redline`, redline);
}

hold('untouched', 1380);
state = { ...state, viewport: 'clause' };
hold('resale-travel', 1700);
openBox('resale', 1100, 240);
advice('resale-negotiation', 'negotiation', 2200);
concede('resale', 'resale', 'resale-ordinary-course-billing', 1400, 1680);

travel('amendments', 'demo:amendments-statement-of-work', 900);
openBox('amendments', 2690);

travel('annual', 'demo:annual-fee-increase-main', 1100);
openBox('annual', 1100);
advice('annual-objections', 'commonObjections', 1100);
concede('annual', 'fees', 'annual-fee-increase-five-percent', 1400, 1680);

travel('attorneys', 'demo:attorneys-fees', 1700);
openBox('attorneys', 1500);
advice('attorneys-negotiation', 'negotiation', 1800);
state = { ...state, box: { ...state.box!, scroll: 'end' } };
hold('attorneys-negotiation-read-more', 2200, { kind: 'panel', clause: state.box!.clause }, 'idle', cursorMoveDuration);
advice('attorneys-approval', 'changesNeedApproval', 1100);
concede('attorneys', 'complete', 'attorneys-fees-mutual', 1500, 1680);

travel('assignment', 'demo:assignment', 900);
openBox('assignment', 2690);

state = { ...state, box: undefined, viewport: 'actions' };
hold('approval-travel', 1580, { kind: 'origin' }, 'idle', cursorMoveDuration);
click('approval', { kind: 'approval' });
hold('approval-clicked', 350, { kind: 'approval' });
hold('completed', 4000);
state = { ...state, opacity: 0 };
hold('fade-out', 250);
state = { clause: 'demo:resale', contract: 'baseline', viewport: 'top', opacity: 0 };
steps.push({ phase: 'reset-hidden', duration: 1, state: { ...state }, cursor: null, motion: { document: 0, paper: 0, opacity: 0 } });
state = { ...state, opacity: 1 };
hold('fade-in', 250);

export const heroTour: ReadonlyArray<AnimationStep> = defineTour(steps);
// The loop ends on the baseline, but reduced motion shows the completed contract.
export const heroCompletedStep = heroTour.find((step) => step.phase === 'completed')!;
