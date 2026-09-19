import type { GuidedTourStep } from '../demo/tour-model.ts';

export const uploadFiles = [
	{
		kind: 'screenshot',
		name: 'buyer-email-screenshot.png',
		meta: 'PNG image',
		intake: { active: 'Reading uploaded changes', done: 'Read uploaded changes' }
	},
	{
		kind: 'recording',
		name: 'gong-call.mp3',
		meta: 'Audio',
		intake: { active: 'Listening to uploaded changes', done: 'Listened to uploaded changes' }
	},
	{
		kind: 'contract',
		name: 'buyer-redline.docx',
		meta: 'Word document',
		intake: { active: 'Reading uploaded changes', done: 'Read uploaded changes' }
	}
] as const;

const findingTask = {
	active: 'Finding what the buyer requested',
	done: 'Found what the buyer requested'
} as const;

export type UploadFileKind = (typeof uploadFiles)[number]['kind'];
export type UploadProcessingTask = { active: string; done: string };

export function uploadFile(kind: UploadFileKind) {
	const file = uploadFiles.find((candidate) => candidate.kind === kind);
	if (!file) throw new Error(`Unknown upload file kind "${kind}".`);
	return file;
}

export function uploadProcessingTasks(kind: UploadFileKind): UploadProcessingTask[] {
	return [uploadFile(kind).intake, findingTask];
}

export type UploadChangesPhase =
	`${UploadFileKind}-${'ready' | 'appear' | 'drag' | 'hover' | 'intake' | 'finding'}`;
export type UploadChangesTarget = 'origin' | 'dropzone';

export interface UploadChangesTourState {
	screen: 'upload' | 'processing';
	file: 'hidden' | 'held';
	hover: boolean;
	kind: UploadFileKind;
	activeTask: number;
	completed: number;
}

export type UploadChangesTourStep = GuidedTourStep<
	UploadChangesPhase,
	UploadChangesTourState,
	UploadChangesTarget
>;

function cycle(kind: UploadFileKind): UploadChangesTourStep[] {
	const idle = { file: 'hidden', hover: false, kind } as const;

	return [
		{
			phase: `${kind}-ready`,
			duration: 700,
			state: { screen: 'upload', activeTask: 0, completed: 0, ...idle },
			cursor: null
		},
		{
			phase: `${kind}-appear`,
			duration: 280,
			state: { screen: 'upload', file: 'held', hover: false, kind, activeTask: 0, completed: 0 },
			cursor: { target: 'origin', mode: 'pressed' }
		},
		{
			phase: `${kind}-drag`,
			duration: 850,
			state: { screen: 'upload', file: 'held', hover: false, kind, activeTask: 0, completed: 0 },
			cursor: { target: 'dropzone', mode: 'pressed' }
		},
		{
			phase: `${kind}-hover`,
			duration: 480,
			state: { screen: 'upload', file: 'held', hover: true, kind, activeTask: 0, completed: 0 },
			cursor: { target: 'dropzone', mode: 'pressed' }
		},
		{
			phase: `${kind}-intake`,
			duration: 1600,
			state: { screen: 'processing', activeTask: 0, completed: 0, ...idle },
			cursor: null
		},
		{
			phase: `${kind}-finding`,
			duration: 2000,
			state: { screen: 'processing', activeTask: 1, completed: 1, ...idle },
			cursor: null
		}
	];
}

export const uploadChangesTour: ReadonlyArray<UploadChangesTourStep> = uploadFiles.flatMap((file) =>
	cycle(file.kind)
);
