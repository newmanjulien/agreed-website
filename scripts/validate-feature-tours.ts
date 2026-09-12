import assert from 'node:assert/strict';
import { cannotChangeTour } from '../src/lib/components/features/cannot-change/cannot-change-tour.ts';
import { commentsTour } from '../src/lib/components/features/comments/comments-tour.ts';
import {
	buildSelectionGeometry,
	deduplicateRects,
	rectRelativeTo,
	selectionPointAt
} from '../src/lib/components/features/comments/selection-geometry.ts';
import { flagChangesTour } from '../src/lib/components/features/flag-changes/flag-changes-tour.ts';
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

for (const tour of [flagChangesTour, cannotChangeTour, commentsTour]) {
	validateTour(tour);
	assert.equal(tour.at(-1)?.cursor, null, 'Reduced-motion final states must hide the cursor.');
}

assert.deepEqual(
	[...flagChangesTour, ...cannotChangeTour, ...commentsTour]
		.filter((step) => step.trackProgress)
		.map((step) => step.phase),
	['drag-selection'],
	'Only selection dragging should request frame-by-frame progress.'
);

const deduplicated = deduplicateRects([
	{ left: 10, top: 20, width: 80, height: 18 },
	{ left: 10.2, top: 20.1, width: 80.1, height: 18 },
	{ left: 10, top: 44, width: 60, height: 18 }
]);
assert.equal(deduplicated.length, 2, 'Equivalent browser rectangles should be collapsed.');

assert.deepEqual(
	rectRelativeTo(
		{ left: 50, top: 40, width: 100, height: 20 },
		{ left: 10, top: 20, width: 200, height: 100 },
		100,
		50
	),
	{ left: 20, top: 10, width: 50, height: 10 },
	'Scaled client rectangles should normalize into local coordinates.'
);

assert.deepEqual(
	rectRelativeTo(
		{ left: 50, top: 40, width: 100, height: 20 },
		{ left: 10, top: 20, width: 0, height: 0 },
		0,
		0
	),
	{ left: 40, top: 20, width: 100, height: 20 },
	'Zero-sized roots should use an identity scale.'
);

const singleLine = buildSelectionGeometry([
	{
		row: { left: 30, top: 8, width: 120, height: 18 },
		scene: { left: 90, top: 120, width: 120, height: 18 }
	}
], 0.08)!;
assert.deepEqual(selectionPointAt(singleLine, 0), { x: 90, y: 129 });
assert.deepEqual(selectionPointAt(singleLine, 1), { x: 210, y: 129 });
assert.deepEqual(singleLine.bounds, { left: 30, top: 8, width: 120, height: 18 });

const wrapped = buildSelectionGeometry([
	{
		row: { left: 40, top: 8, width: 100, height: 18 },
		scene: { left: 40, top: 8, width: 100, height: 18 }
	},
	{
		row: { left: 0, top: 32, width: 100, height: 18 },
		scene: { left: 0, top: 32, width: 100, height: 18 }
	}
], 0.1)!;
const wrappedTransitionPoint = selectionPointAt(wrapped, 0.5);
assert.ok(Math.abs(wrappedTransitionPoint.x - 70) < 0.001);
assert.ok(Math.abs(wrappedTransitionPoint.y - 29) < 0.001);
assert.deepEqual(selectionPointAt(wrapped, 1), { x: 100, y: 41 });
