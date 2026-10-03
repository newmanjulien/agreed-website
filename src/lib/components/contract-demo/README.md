# Shared contract demo

This is a self-contained snapshot of the Oceans rep experience from
`oceans-agreed-main`, taken on October 2, 2026. The website runs entirely from
these local files; the source project is only a reference for future updates.

`hero/oceans-demo/OceansDemo.svelte` fits a 1440px desktop stage into the hero frame.
`hero/oceans-demo/DemoRepWorkspace.svelte` owns local concession selection and guidance. The
demo has no header; the document viewport fills the stage. Static source indexing, composition, preparation, baseline pagination, and numeric
profiles are shared across viewers for the browser application lifetime. Failed updates keep the previous document
visible and offer Retry or restoration of its concession selection. Guidance boxes
start at the selected highlighted line and scroll with it, without a title row.
Short panels pass scrolling through to the document; overflowing panels scroll internally.
Contract composition, pagination, annotation geometry, and conflict checks
retain the source renderer's behavior for text. Tables preserve the original contract
wording and formatting as static rows of text. They have no annotations, guidance,
or discount actions; pagination measures each table once and keeps it whole.
There is no auth, backend, or persistence.

`components/playbook/ContractActions.svelte` derives `requiresApproval` from the displayed snapshot's concessions
and their explicit `requiresApproval` flags. Any rendered concession requiring approval
enables Ask for approval and disables Send to buyer; successfully removing the last such
concession reverses them. Pending or failed updates retain the displayed document's approval state.
Both buttons are no-ops. An optional `footerContent` snippet places them under the
last page in the document column, outside the measured and virtualized document stage.
The approval feature tour uses the same footer and frames the end of the contract;
the other feature tours omit it. Approval metadata does not enter the render-source projection.

The viewport context in `document/document-viewport.ts` translates screen
coordinates through the stage scale and scrolls only the embedded container.
`+layout.svelte` owns a single hidden, unscaled profile surface for all demos. Keep
that surface outside their transformed stages: transformed glyph measurements
can violate the renderer's layout tolerance at responsive widths.

To refresh the data, convert the source's `data/convex/contractBlocks.jsonl` and
`data/convex/playbookItems.jsonl` to the JSON arrays in `data/`. For each playbook
row, add `_id: "demo:" + row.triggers[0].id` and omit `authoringMode` and database
metadata. Set each concession's `requiresApproval` flag explicitly; the current snapshot
uses its clause's Changes need approval guidance (resale is pre-approved, all other
concessions require approval). Keep this separate from the preferred/rare tier.
Confirm first trigger IDs are unique. `data/fixture.ts` supplies these
arrays directly to the renderer; do not introduce runtime data fetching.
For tables, join each cell's text atoms into a string; preserve row order,
`headerRowCount`, and the signature variant. Omit playbook items that target table cells.

Validate with `npm run check` and `npm run build`, then review initial rendering,
guidance, single- and multi-range apply/remove, conflicts, internal scrolling,
and responsive resizing in a browser. The current snapshot has no cross-item
concession conflicts; overlap protection can be checked with temporary local
review data without changing the checked-in fixture.

`ContractViewer.svelte` renders each scene's requested concession selection; `DocumentPresentation.svelte` consumes
immutable snapshots and independent viewport, hover, panel, and focus state. All three feature
animations use `features/demo/ContractFeatureDemo.svelte` for the camera, cursor, lazy
mounting, and playback, and `ContractTourScene.svelte` for the document and guidance.
Their timelines choose a clause, open guidance sections, and optionally apply a concession.
The approval tour starts with the mutual attorneys' fees concession rendered, then moves
the shared cursor to Ask for approval and clicks it. Its `mode: 'actions'` scene keeps
the footer in view; the other tours use `mode: 'clause'`. The scene reports a typed
layout after the viewer confirms a successful current render. The cursor observes
viewport scrolling so responsive camera alignment also updates its destination. Each widget is a thin
wrapper around its own timeline and the shared feature demo.
Each scene has an independent renderer; unchanged contracts share baseline pagination.
The resale tour applies the same concession as the hero and holds its completed state.
Complete pagination stays
in memory while only viewport pages, one page above/below, and temporary panel/focus or
scroll-anchor destinations mount token DOM. Browser text selection is disabled in the
contract; source coordinates remain for annotation and scroll anchoring.

The native profile surface is shared. It profiles chosen alternatives on demand, uses
lightweight typography-equivalent markup, and yields between 8ms processing slices and
long token scans. The cache retains snapshot/viewer owners independently and keeps at
most 256 unreferenced shapes. Camera observers coalesce into animation frames and never
invalidate native text geometry. Contract typography uses installed Arial/Helvetica;
marketing webfont readiness does not invalidate it.

`BlockFragment.svelte` owns the document’s Tailwind typography and table styles for
both visible pages and the profile surface. Keep those styles shared so pagination
measures the same layout that visitors see. `styles/demo.css` scopes the demo tokens;
custom component CSS is reserved for animations and layout formulas.

`document/runtime/preparation.ts` shares the source composition and preparation caches;
viewer selections and published snapshots remain independent. Failed baseline work is
evicted so viewers can retry. Typography failures expose Retry, and viewport
observers persist across snapshot commits in `document/runtime/page-window.svelte.ts`.

Renderer/cache/cancellation tests run separately with `npm run test:contract-renderer`.
`npm run check` validates Svelte and feature tours. Browser regression scripts
accept `PLAYWRIGHT_MODULE` (optional path to an installed Playwright index.mjs),
`CHROME_PATH` (optional Chromium executable), `BROWSER=webkit`, and `DEMO_URL` (defaults
to the production preview at http://127.0.0.1:5188). Run
`node scripts/test-contract-browser.mjs`, `node scripts/test-contract-lifecycle.mjs`, and
`node scripts/measure-contract-renderer.mjs <label>` against a production build. Results
and screenshots live in `artifacts/renderer-performance/`; see
[`REPORT.md`](../../../../artifacts/renderer-performance/REPORT.md) for measurements
and remaining validation limits.
