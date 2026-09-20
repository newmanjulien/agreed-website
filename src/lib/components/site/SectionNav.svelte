<script lang="ts">
  import { on } from 'svelte/events';

  type Section = { id: string; label: string };

  const REST_W = 8;
  const ACTIVE_W = 14;
  const MAX_W = 17;
  const REST_H = 2;
  const MAX_H = 3;
  const FALL_OFF = 2.2;

  let { sections, cover }: { sections: Section[]; cover?: string } = $props();

  let activeId = $state('');
  let visible = $state(false);
  let fullyClipped = $state(false);
  let clipBottom = $state(0);
  let navEl = $state<HTMLElement | null>(null);
  let listEl = $state<HTMLUListElement | null>(null);
  let hoverY = $state<number | null>(null);
  let focusedId = $state('');
  let centers = $state<number[]>([]);
  let pitch = $state(14);
  let reduceMotion = $state(false);
  const currentId = $derived(activeId || sections[0]?.id || '');

  const magnetY = $derived.by(() => {
    if (hoverY != null) return hoverY;
    if (!focusedId) return null;
    const index = sections.findIndex((section) => section.id === focusedId);
    return index >= 0 ? (centers[index] ?? null) : null;
  });

  const hotIndex = $derived.by(() => {
    if (magnetY == null || centers.length === 0) return -1;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < centers.length; i++) {
      const dist = Math.abs(centers[i] - magnetY);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  });

  $effect(() => {
    const items = sections;
    const coverId = cover;
    const nav = navEl;

    function update() {
      const first = items[0];
      const last = items.at(-1);
      const firstEl = first ? document.getElementById(first.id) : null;
      const lastEl = last ? document.getElementById(last.id) : null;
      const coverEl = coverId ? document.getElementById(coverId) : null;
      const mid = window.innerHeight / 2;
      const navRect = nav?.getBoundingClientRect();
      const overlap =
        coverEl && navRect
          ? Math.max(0, Math.ceil(navRect.bottom - coverEl.getBoundingClientRect().top))
          : 0;

      clipBottom = overlap;
      fullyClipped = Boolean(navRect && navRect.height > 0 && overlap >= navRect.height);

      const pastStart = Boolean(firstEl && firstEl.getBoundingClientRect().bottom < mid);
      const pastEnd = coverEl
        ? false
        : Boolean(lastEl && lastEl.getBoundingClientRect().bottom <= mid);

      visible = pastStart && !pastEnd;

      const probe = Math.round(window.innerHeight * 0.6);
      let next = first?.id ?? '';

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= probe) next = item.id;
      }

      const atEnd =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atEnd && last) next = last.id;

      activeId = next;
    }

    function onResize() {
      update();
      measure();
    }

    update();
    const offScroll = on(window, 'scroll', update, { passive: true });
    const offResize = on(window, 'resize', onResize);
    return () => {
      offScroll();
      offResize();
    };
  });

  $effect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reduceMotion = media.matches;
    };
    sync();
    const off = on(media, 'change', sync);
    return () => off();
  });

  function measure() {
    if (!listEl) return;
    const links = listEl.querySelectorAll('a');
    centers = Array.from(links, (el) => {
      const rect = el.getBoundingClientRect();
      return rect.top + rect.height / 2;
    });
    if (centers.length > 1) pitch = centers[1] - centers[0];
  }

  function onPointer(event: PointerEvent) {
    measure();
    hoverY = event.clientY;
  }

  function onLeave() {
    hoverY = null;
  }

  function onFocus(id: string) {
    measure();
    focusedId = id;
  }

  function onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (next instanceof Node && listEl?.contains(next)) return;
    focusedId = '';
  }

  function tickVars(width: number, height: number) {
    return `--tick-w: ${width}px; --tick-h: ${height}px`;
  }

  function tickStyle(index: number, isActive: boolean) {
    const restW = isActive ? ACTIVE_W : REST_W;
    const restH = isActive ? MAX_H : REST_H;

    if (magnetY == null) return tickVars(restW, restH);

    if (reduceMotion) {
      const expanded = isActive || index === hotIndex;
      return tickVars(expanded ? ACTIVE_W : restW, expanded ? MAX_H : restH);
    }

    const t = Math.max(0, 1 - Math.abs((centers[index] ?? magnetY) - magnetY) / (pitch * FALL_OFF));
    return tickVars(
      Math.max(restW, REST_W + (MAX_W - REST_W) * t),
      Math.max(restH, REST_H + (MAX_H - REST_H) * t)
    );
  }

  function jumpTo(event: MouseEvent, id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    event.preventDefault();
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }
</script>

<nav
  bind:this={navEl}
  class={[
    'section-nav z-layer-chrome pointer-events-none fixed right-[44px] top-1/2 hidden -translate-y-1/2 lg:block',
    visible && 'is-visible',
    clipBottom > 0 && 'is-clipped'
  ]}
  style={clipBottom > 0 ? `--nav-clip-bottom: ${clipBottom}px` : undefined}
  aria-label="On this page"
  inert={!visible || fullyClipped}
>
  <ul
    bind:this={listEl}
    class="pointer-events-auto flex w-10 flex-col items-end py-1"
    onpointerenter={onPointer}
    onpointermove={onPointer}
    onpointerleave={onLeave}
    onfocusout={onFocusOut}
  >
    {#each sections as section, index (section.id)}
      {@const isActive = currentId === section.id}
      {@const isHot = index === hotIndex}
      <li class="w-full">
        <a
          href="#{section.id}"
          class={['relative flex h-[14px] w-full items-center justify-end', isHot && 'is-hot']}
          style={tickStyle(index, isActive)}
          aria-current={isActive ? 'location' : undefined}
          aria-label={section.label}
          onfocus={() => onFocus(section.id)}
          onclick={(event) => jumpTo(event, section.id)}
        >
          <span class="section-nav-tooltip" aria-hidden="true">{section.label}</span>
          <span class={['section-nav-tick', isActive && 'is-active']} aria-hidden="true"></span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .section-nav {
    opacity: 0;
    transition: opacity 180ms ease;
  }

  .section-nav.is-visible {
    opacity: 1;
  }

  .section-nav.is-clipped {
    clip-path: inset(0 0 var(--nav-clip-bottom) 0);
  }

  .section-nav-tick {
    display: block;
    width: var(--tick-w, 8px);
    height: var(--tick-h, 2px);
    border-radius: 99px;
    background: var(--color-line-mid);
    transition:
      width 180ms ease,
      height 180ms ease,
      background-color 180ms ease;
  }

  .section-nav-tick.is-active,
  .section-nav a.is-hot .section-nav-tick,
  .section-nav a:focus-visible .section-nav-tick {
    background: var(--color-ink);
  }

  .section-nav-tooltip {
    position: absolute;
    top: calc(100% + 7px);
    right: 0;
    z-index: 1;
    width: max-content;
    padding: 7px 10px;
    border-radius: 7px;
    background: #fff;
    color: var(--color-ink);
    font-size: 12px;
    font-weight: 450;
    line-height: 1;
    white-space: nowrap;
    box-shadow: 0 6px 16px color-mix(in srgb, var(--color-ink) 18%, transparent);
    opacity: 0;
    transform: translateY(-3px);
    pointer-events: none;
    transition:
      opacity 160ms ease,
      transform 160ms ease;
  }

  .section-nav a.is-hot .section-nav-tooltip,
  .section-nav a:focus-visible .section-nav-tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .section-nav a:focus-visible {
    outline: none;
  }

  .section-nav a:focus-visible .section-nav-tick {
    outline: 2px solid var(--color-ink);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .section-nav,
    .section-nav-tick,
    .section-nav-tooltip {
      transition: none;
    }
  }
</style>
