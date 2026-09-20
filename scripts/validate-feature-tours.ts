import assert from 'node:assert/strict';
import { acceptChangesTour } from '../src/lib/components/features/accept/accept-changes-tour.ts';
import {
	approvalDemo,
	approvalTour,
	approvalTypedText
} from '../src/lib/components/features/approval/approval-tour.ts';
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

for (const tour of [uploadChangesTour, acceptChangesTour, approvalTour]) {
	validateTour(tour);
	assert.equal(tour.at(-1)?.cursor, null, 'Reduced-motion final states must hide the cursor.');
}

assert.deepEqual(
	[...uploadChangesTour, ...acceptChangesTour, ...approvalTour]
		.filter((step) => step.trackProgress)
		.map((step) => step.phase),
	['typing'],
	'Only explanation typing should request frame-by-frame progress.'
);

assert.equal(approvalTypedText(0), '');
assert.equal(approvalTypedText(1), approvalDemo.explanation);
assert.equal(approvalTour.at(-1)?.state.typedProgress, 1);
