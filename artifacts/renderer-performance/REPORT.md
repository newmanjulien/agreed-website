# Contract renderer performance results

Measured on the same local macOS ARM machine against production builds on October 2, 2026. The implementation removes speculative concession profiling and contract selection tracking, shares immutable baseline layout across the hero and summary, and mounts a viewport page window. The complete contract remains available in both viewers.

## Recorded results

Each scenario used twenty width changes across the 640px and 1024px breakpoints. “Summary mounting” initializes the summary during the resize sequence. Latency is measured from the browser resize event to an animation-frame callback followed by a timer; it is a paint opportunity proxy, not a hardware presentation timestamp.

| Scenario | Chromium resize p95 | WebKit resize p95 | Mounted content after resizing |
| --- | ---: | ---: | --- |
| Hero alone | 3.5ms | 21ms | 3 of 18 pages |
| Both viewers ready | 5.0ms | 33ms | 3 of 18 pages per viewer |
| Summary mounting | 4.9ms | 48ms | 3 of 18 pages per viewer |

All recorded p95 values are below the requested 100ms threshold. Chromium recorded no tasks above 50ms during these resize sequences. WebKit does not expose the Long Tasks API in the tested version, so its task-duration criterion remains unverified. One Chromium initial-readiness run recorded a 52ms task while other browser checks were running; the implementation does not guarantee an initial-load task ceiling.

The original hero resize sequence recorded 21 long tasks, with the longest lasting 9,316ms. Its event-to-paint p95 was only 35.4ms because this metric misses stalls between delivered resize events. The long-task record is essential to interpreting that baseline. The original both-viewer sequence stalled before completing; only its initial measurements were recovered.

| Chromium measurement | Original | Final |
| --- | ---: | ---: |
| Hero document-wide element count | 8,030 | 1,641 |
| Both-viewer document-wide element count | 15,699 | 2,922 before explanation reveal |
| Hero mounted page content | 18 | 3 |
| Both-viewer mounted page content | 36 | 6 |
| Hero initial `createRange` calls | 16,410 | 102 |
| Hero cumulative `createRange` calls after resizing | 311,618 | 102 |

The DOM figures include marketing content, not just contract nodes. Explanation reveal adds a few nodes. Range counters measure allocations, not retained ranges or a proven leak; no garbage collection was forced.

The profiling-surface mutation counter stayed at 41 in every final scenario, including summary mounting. Ready viewers' snapshot commit identifiers also stayed unchanged through resizing. These observations show that scale-only resizing did not profile or repaginate and that the summary reused baseline geometry. Surface mutations are instrumentation proxies, not a count of individual layout reads.

## Implementation

- Contract text selection, its listeners/ranges/overlays, and speculative concession prewarming are removed. Source coordinates remain for annotation anchoring and scroll restoration.
- Each scene's renderer publishes complete snapshots to `DocumentPresentation.svelte`. The feature scenes share baseline pagination; local editing state belongs to the hero.
- Static source preparation, baseline composition, pagination, and native geometry are shared. Concurrent identical geometry requests are deduplicated. Snapshot owners retain profiles independently; at most 256 unreferenced profiles remain in the LRU.
- Full document height comes from the logical pagination snapshot. Only viewport pages, one neighboring page on each side, and temporary focus/panel/scroll-anchor destinations mount content. Source indexes resolve destinations before mounting them.
- Profiling uses lightweight typography-equivalent markup, scratch ranges, cancellation checks, and an 8ms scheduling target with browser yields. Geometry belongs to mounted pages and is released when those pages leave the window. Individual native layout operations can still exceed that scheduling target.
- Camera and resize observers coalesce work into animation frames without invalidating native text layout. Installed Arial/Helvetica readiness is handled separately from marketing webfonts.
- WebKit line-height rounding is measured from actual line boxes. Camera observers also avoid the ResizeObserver feedback loop found during verification.

## Completed verification

The existing checks, feature playback validation, targeted renderer checks, and production build passed. Svelte reported zero errors and warnings. Chromium and WebKit browser verification completed with no captured application errors and covered:

- Scrolling through all 18 pages and Tab navigation across unmounted page boundaries.
- Clause guidance, redlines, and Apply/Remove for all 21 saved concessions.
- Summary target mounting, explanation reveal, and independence from hero edits.
- Simulated touch-drag suppression and source-anchor restoration after removal where an anchor could be observed.

Chromium pagination fragment boundaries matched the original baseline across all 18 pages. Screenshots were reviewed for the hero, guidance, and summary. WebKit retains 18 pages but has different line/page boundaries because of native line-height rounding; a complete original WebKit pagination baseline was unavailable.

The lifecycle check covered delayed contract-font readiness, failed profiling cleanup, successful Retry, and four navigation mount/unmount cycles. Page DOM disappeared on unmount. Remounted page counts stayed at six, document element counts stabilized at 2,976, and profiling token-read counts stayed unchanged at 7,228. Targeted renderer checks covered independent cache ownership, the 256-entry bound, shared baseline reuse, stale epochs, cancellation, and source-to-page lookup.

## Remaining limits

The major mechanisms were not isolated into successful independent measurements: an intermediate run failed to reach readiness. The combined before/after result demonstrates removal of the observed multi-second resize stalls, but does not establish each mechanism's individual contribution or prove that range allocation caused the original mutation cost.

WebKit long-task durations, physical touch hardware, exhaustive multiline pointer positioning, and every scroll-anchor case remain unverified. The four lifecycle cycles establish bounded observed DOM and reuse, not a long-duration heap-leak proof. No further browser runs were performed after the user's request to wrap up with less testing.

## Evidence files

- [Final Chromium measurements](final-chromium.json) and [final WebKit measurements](final-webkit.json).
- [Recovered hero baseline](baseline-recovered.json) and [recovered initial baseline](baseline-initial-recovered.json). The original harness stalled; these files were recovered from its in-memory results.
- [Chromium functional results](browser-chromium.json), [WebKit functional results](browser-webkit.json), and [lifecycle results](lifecycle.json).
- Baseline and final screenshots are stored alongside these files.
