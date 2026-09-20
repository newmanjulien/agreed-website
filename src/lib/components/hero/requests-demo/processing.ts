export type ProcessingTask = { active: string; done: string };

export const defaultIntake = {
	active: 'Reading uploaded changes',
	done: 'Read uploaded changes'
} as const satisfies ProcessingTask;

export const processingHoldMs = 650;

export const processingStepDefs = [
	{ phase: 'intake', workMs: 1800, task: defaultIntake },
	{
		phase: 'finding',
		workMs: 1800,
		task: { active: 'Finding what the buyer requested', done: 'Found what the buyer requested' }
	},
	{
		phase: 'checking',
		workMs: 2200,
		task: { active: 'Checking what you can accept', done: 'Checked what you can accept' }
	},
	{
		phase: 'preparing',
		workMs: 1800,
		task: { active: 'Preparing your response', done: 'Prepared your response' }
	}
] as const;

export type ProcessingPhase = (typeof processingStepDefs)[number]['phase'];

export function processingTasks(intake: ProcessingTask = defaultIntake): ProcessingTask[] {
	return processingStepDefs.map((step, index) => (index === 0 ? intake : step.task));
}

function wait(ms: number, signal: AbortSignal) {
	return new Promise<void>((resolve, reject) => {
		const id = setTimeout(resolve, ms);
		const onAbort = () => {
			clearTimeout(id);
			reject(new DOMException('Aborted', 'AbortError'));
		};

		if (signal.aborted) {
			onAbort();
			return;
		}

		signal.addEventListener('abort', onAbort, { once: true });
	});
}

export async function playProcessingSequence({
	signal,
	onActive,
	onCompleted
}: {
	signal: AbortSignal;
	onActive: (index: number) => void;
	onCompleted: (count: number) => void;
}): Promise<'finished' | 'aborted'> {
	try {
		for (let i = 0; i < processingStepDefs.length; i++) {
			onActive(i);
			onCompleted(i);
			await wait(processingStepDefs[i]!.workMs, signal);
			onCompleted(i + 1);
			await wait(processingHoldMs, signal);
		}

		return 'finished';
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') return 'aborted';
		throw error;
	}
}
