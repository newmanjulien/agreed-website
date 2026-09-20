import {
	defaultIntake,
	processingHoldMs,
	processingStepDefs,
	processingTasks,
	type ProcessingPhase
} from '../../hero/requests-demo/processing.ts';
import type { GuidedTourStep } from '../demo/tour-model.ts';

export const uploadFile = {
	name: 'buyer-email-screenshot.png',
	meta: 'PNG image'
} as const;

export const uploadProcessingTasks = processingTasks(defaultIntake);

export type UploadChangesPhase =
	| 'ready'
	| 'appear'
	| 'drag'
	| 'hover'
	| ProcessingPhase
	| `${ProcessingPhase}-done`
	| 'review';
export type UploadChangesTarget = 'origin' | 'dropzone';

export type UploadChangesTourState =
	| {
			screen: 'upload' | 'processing';
			file: 'hidden' | 'held';
			hover: boolean;
			activeTask: number;
			completed: number;
	  }
	| {
			screen: 'review';
	  };

export type UploadChangesTourStep = GuidedTourStep<
	UploadChangesPhase,
	UploadChangesTourState,
	UploadChangesTarget
>;

const idle = { file: 'hidden', hover: false } as const;

export const uploadChangesTour: ReadonlyArray<UploadChangesTourStep> = [
	{
		phase: 'ready',
		duration: 700,
		state: { screen: 'upload', activeTask: 0, completed: 0, ...idle },
		cursor: null
	},
	{
		phase: 'appear',
		duration: 280,
		state: { screen: 'upload', file: 'held', hover: false, activeTask: 0, completed: 0 },
		cursor: { target: 'origin', mode: 'pressed' }
	},
	{
		phase: 'drag',
		duration: 850,
		state: { screen: 'upload', file: 'held', hover: false, activeTask: 0, completed: 0 },
		cursor: { target: 'dropzone', mode: 'pressed' }
	},
	{
		phase: 'hover',
		duration: 480,
		state: { screen: 'upload', file: 'held', hover: true, activeTask: 0, completed: 0 },
		cursor: { target: 'dropzone', mode: 'pressed' }
	},
	...processingStepDefs.flatMap((step, index): UploadChangesTourStep[] => [
		{
			phase: step.phase,
			duration: step.workMs,
			state: { screen: 'processing', activeTask: index, completed: index, ...idle },
			cursor: null
		},
		{
			phase: `${step.phase}-done`,
			duration: processingHoldMs,
			state: { screen: 'processing', activeTask: index, completed: index + 1, ...idle },
			cursor: null
		}
	]),
	{
		phase: 'review',
		duration: 2800,
		state: { screen: 'review' },
		cursor: null
	}
];
