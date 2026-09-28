import assert from 'node:assert/strict';
import { acceptChangesTour } from '../src/lib/components/features/accept/accept-changes-tour.ts';
import {
	discussionDemo,
	discussionRequest,
	discussionTour
} from '../src/lib/components/features/discussion/discussion-tour.ts';
import { uploadChangesTour } from '../src/lib/components/features/upload/upload-changes-tour.ts';
import type { GuidedTourStep } from '../src/lib/components/features/demo/tour-model.ts';

function validateTour(steps: ReadonlyArray<GuidedTourStep>): void {
	assert.ok(steps.length > 0, 'A guided tour requires at least one step.');
	const phases = new Set<string>();
	for (const step of steps) {
		assert.ok(Number.isFinite(step.duration) && step.duration > 0, `${step.phase} must have a positive duration.`);
		assert.ok(!phases.has(step.phase), `${step.phase} must be unique within its tour.`);
		phases.add(step.phase);
	}
}

for (const tour of [uploadChangesTour, acceptChangesTour, discussionTour]) {
	validateTour(tour);
	assert.equal(tour.at(-1)?.cursor, null, 'Reduced-motion final states must hide the cursor.');
}

assert.deepEqual(
	[...uploadChangesTour, ...acceptChangesTour, ...discussionTour]
		.filter((step) => step.trackProgress)
		.map((step) => step.phase),
	[],
	'These tours have no frame-by-frame text animation.'
);

assert.equal(uploadChangesTour.at(-1)?.state.screen, 'review');
assert.equal(discussionTour[0]?.state.panelOpen, false);
assert.equal(discussionTour.at(-1)?.state.questionOpen, true);
assert.ok(discussionRequest.discussionGuide.questions.some((item) => item.id === discussionDemo.questionId));
