# Product animations

The hero and three feature illustrations share `ProductAnimation.svelte`.
They are inert illustrations: the cursor never dispatches events or sends
approval requests. Their wording, page groups, and stories are authored assets.

## Content preparation

`data/contract.json` contains the full Oceans contract, compact highlighted runs,
authored pages, guidance, and five finite contract states. Each state stores only
changed blocks, selected concessions, and its approval count. The annual fee
concession changes both the agreement and Exhibit A.

Added text uses yellowish green; deleted text uses gray with strikethrough.
Selection and hover only color unchanged runs. Revised runs retain trigger
markers for framing. Plain runs render as text without extra wrappers.

Run `npm run prepare:animations` using Node 24 or later after changing the source
JSON, concessions, or page endings. Preparation imports TypeScript directly;
it does not start Vite. `createContractComposer(blocks, overlays)` prepares the
immutable source index, atoms, and trigger geometry once and returns a function
that composes each selection independently. Unknown items and concessions,
conflicts, invalid ranges, and ambiguous trigger ownership fail preparation.
States retain source numbering, references, optional paragraphs, and readable
redlines. Baseline composition runs once, followed by the four changed states.

Source data and composition live in `scripts/product-animation` and stay out of
browser bundles. The browser performs no indexing, conflict resolution, text
profiling, pagination, or editing. Pages grow when wording wraps on mobile.

## Timeline and clock

Scenes and frame values use shallow reactive references to preserve their
immutable identity. Each beat declares its duration, discrete contract and guidance scene, typed
cursor target, and motion cues. A viewed clause is independent of the optional
open box. Concession targets specify the actual concession ID. `defineTour`
expands scene changes into motion cues at module initialization; phase names
are identifiers only. Shared timing constants and clock-sampled easing retain
the existing motion. Targets are validated against prepared content at startup.

`tour-player.svelte.ts` owns one logical clock per illustration. Its elapsed beat
time drives document and panel scrolling, paper centering, guidance entrance,
cursor movement and opacity, click feedback, and loop fades. Frames run only
while geometry or paint is moving; stationary holds use a timer. A boundary
timer settles motion even if the final animation frame arrives late. There are
no autonomous CSS animations, animation-pausing observers, or motion callbacks
with their own elapsed time.

Only the elected visible illustration plays. Visibility is normalized by the
area that can fit in the viewport, so short viewports can start tall frames.
Thresholds rebuild on resize and retain the existing election hysteresis.
Missing IntersectionObserver support mounts illustrations immediately and
measures visibility on scroll and resize; hidden tabs still pause. Geometry preparation pauses the clock
without giving up an existing session's eligibility.

Reduced motion is observed throughout the mounted lifetime, including startup.
Enabling it saves the current beat and elapsed time and shows the completed
scene without a cursor. Disabling it restores that position after measurement.
Completed feature tours stay complete. Reduced-motion sessions do not compete
for playback. Observers, listeners, timers, and frames are cleaned up on destroy.

## Geometry and rendering

`scene-geometry.ts` owns DOM measurement, cached target coordinates, crop and
scale, scrolling, clause anchors, and presentation frames. It measures after
scene DOM updates and invalidates its cache when contract or guidance content,
frame dimensions, or fonts change. Ordinary beats reuse measurements. Reads
are grouped before layout writes; animation frames use cached coordinates and
known offsets. Contract rendering responds only to discrete scene changes.
`GuidedCursor` and `GuidancePanel` are presentation components.

Desktop feature frames crop around the clause and guidance; the hero keeps its
wide workspace. The hero starts at the contract top with centered paper and no
box. The paper shifts when the first box opens. Boxes stay open during travel
and are replaced on the next clause click. Guidance attaches to its own clause
inside the document viewport. Mobile preserves the 80px anchor offset and hides
the guidance overlay during revision framing. The rail owns entrance motion for
both first opening and replacement.

Panel-frame targets stay attached to the box itself while its contents scroll;
section and concession targets follow the scrolling contents.
Cursor approach is distinct from tracking its attachment through camera, paper,
or panel movement. Translation preserves the cursor tip and inverse scale
preserves its apparent size. Resizing preserves the beat and elapsed progress,
remeasures, and snaps to the corresponding frame without replaying entrances.

The hero visits five boxes, applies three concessions, opens two description-only
boxes, and ends with approval. It loops after the completed hold and fade/reset.
`heroCompletedStep` supplies the reduced-motion scene separately from the loop's
last beat. Feature tours keep their existing stories and finish once.

The hero mounts eagerly. Features mount once within a 600px viewport margin;
their frames and accessible descriptions remain present before mounting.
Server-rendered `<noscript>` illustrations retain a static paper fallback. That
fallback still contributes HTML but creates no active hydrated contract tree.
Paper renders before playback starts. Each illustration exposes one accessible
description, with inert contents hidden from assistive technology and pointer
events passing through to website scrolling.

## Validation

Run `npm run build` for Svelte checks, existing timeline and playback validation,
and the production build. Do not create tests. A focused browser pass is needed
when changing motion geometry: review desktop and mobile centering, clause and
pointer alignment, panel scrolling, redlines, approval, looping, live reduced
motion, offscreen pause, short viewports, and resizing during movement.

The missing-IntersectionObserver fallback covers these illustrations and section
reveals. SvelteKit itself still assumes that API for link preloading; disabling it
globally in a browser check produces a framework preload exception even though
the illustrations mount and play.
