import assert from 'node:assert/strict';
import { acceptChangesTour } from '../src/lib/components/features/accept/accept-changes-tour.ts';
import { summaryTour } from '../src/lib/components/features/summary/summary-tour.ts';
import { approvalTour } from '../src/lib/components/features/approval/approval-tour.ts';
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

for (const tour of [summaryTour, acceptChangesTour, approvalTour]) {
	validateTour(tour);
	assert.equal(tour.at(-1)?.cursor, null, 'Reduced-motion final states must hide the cursor.');
}
