import { motionTiming, type GuidedTourStep } from './tour-model.ts';

export type ContractStateId = 'baseline' | 'resale' | 'fees' | 'complete' | 'approval';
export interface PreparedRun {
	text: string;
	revision?: 'added' | 'removed';
	target?: string;
}
export interface PreparedBlock {
	kind: 'heading' | 'paragraph' | 'table';
	level?: number;
	runs?: PreparedRun[];
	rows?: string[][];
	headerRowCount?: number;
	variant?: string;
}
export interface PreparedConcession {
	id: string;
	description: string;
}
export interface PreparedPanel {
	id: string;
	triggerId: string;
	summary: string;
	important: boolean;
	sections: { key: string; label: string; text?: string; concessions?: PreparedConcession[] }[];
}
export interface PreparedContract {
	blocks: Record<string, PreparedBlock>;
	pages: string[][];
	states: Record<ContractStateId, {
		patches: Record<string, PreparedBlock>;
		concessions: Record<string, string>;
		approvalCount: number;
	}>;
	panels: PreparedPanel[];
}
export interface AnimationState {
	contract: ContractStateId;
	/** The clause being viewed, even when its box is closed. */
	clause: string;
	box?: { clause: string; section?: string | null; scroll?: 'start' | 'end' };
	hovered?: boolean;
	/** Revision framing reveals the active clause's redline without a mobile overlay. */
	viewport?: 'top' | 'clause' | 'revision' | 'actions';
	opacity?: number;
}
export type AnimationTarget =
	| { kind: 'origin' }
	| { kind: 'clause'; clause: string }
	| { kind: 'section'; clause: string; section: string }
	| { kind: 'concession'; clause: string; concession: string }
	| { kind: 'panel'; clause: string }
	| { kind: 'approval' };
export type AnimationStep = GuidedTourStep<string, AnimationState, AnimationTarget>;
export const cursorMoveDuration = 850;
export { motionTiming };

/** Authoring expands scene changes into explicit motion cues, once at module load. */
export function defineTour(steps: readonly AnimationStep[]): readonly AnimationStep[] {
	return steps.map((step, index) => {
		const previous = steps[index - 1];
		const scene = step.state;
		const before = previous?.state;
		const motion = { ...step.motion };
		if (before) {
			if (before.clause !== scene.clause || before.viewport !== scene.viewport)
				motion.document ??= Math.min(step.duration, scene.viewport === 'revision' ? 900 : 1700);
			if (Boolean(before.box) !== Boolean(scene.box)) motion.paper ??= motionTiming.paper;
			if (scene.box && scene.box.clause !== before.box?.clause) motion.guidance ??= motionTiming.guidance;
			if (scene.box && (scene.box.section !== before.box?.section || scene.box.scroll !== before.box?.scroll ||
				JSON.stringify(step.cursor?.target) !== JSON.stringify(previous?.cursor?.target))) motion.panel ??= motionTiming.panel;
			if ((before.opacity ?? 1) !== (scene.opacity ?? 1)) motion.opacity ??= motionTiming.loopFade;
		}
		if (previous?.cursor && !step.cursor) motion.cursorOpacity ??= motionTiming.cursorFade;
		const cursor = step.cursor ? { ...step.cursor } : null;
		if (cursor && !previous?.cursor) cursor.fade ??= motionTiming.cursorFade;
		return { ...step, motion, cursor };
	});
}
