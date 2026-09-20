<script lang="ts">
  import { on } from 'svelte/events';

  type Section = { id: string; label: string };

  let { sections }: { sections: Section[] } = $props();

  let activeId = $state('');
  let visible = $state(false);
  const currentId = $derived(activeId || sections[0]?.id || '');

  $effect(() => {
    const items = sections;

    function update() {
      const first = items[0];
      const last = items.at(-1);
      const firstEl = first ? document.getElementById(first.id) : null;
      const lastEl = last ? document.getElementById(last.id) : null;
      const mid = window.innerHeight / 2;

      visible = Boolean(
        firstEl &&
          lastEl &&
          firstEl.getBoundingClientRect().bottom < mid &&
          lastEl.getBoundingClientRect().bottom > mid
      );

      const probe = Math.round(window.innerHeight * 0.28);
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

    update();
    const offScroll = on(window, 'scroll', update, { passive: true });
    const offResize = on(window, 'resize', update);
    return () => {
      offScroll();
      offResize();
    };
  });

  function jumpTo(event: MouseEvent, id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }
</script>

<nav
  class={[
    'section-nav z-layer-chrome pointer-events-none fixed right-[44px] top-1/2 hidden -translate-y-1/2 lg:block',
    visible && 'is-visible'
  ]}
  aria-label="On this page"
  inert={!visible}
>
  <ul class="flex flex-col items-end gap-px">
    {#each sections as section (section.id)}
      {@const isActive = currentId === section.id}
      <li>
        <a
          href="#{section.id}"
          class="pointer-events-auto relative flex h-[14px] w-[28px] items-center justify-end"
          aria-current={isActive ? 'location' : undefined}
          aria-label={section.label}
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

  .section-nav-tick {
    display: block;
    width: 7px;
    height: 1.7px;
    border-radius: 99px;
    background: var(--color-line-strong);
    transition:
      width 180ms ease,
      height 180ms ease,
      background-color 180ms ease;
  }

  .section-nav-tick.is-active,
  .section-nav a:hover .section-nav-tick,
  .section-nav a:focus-visible .section-nav-tick {
    width: 13px;
    height: 2.5px;
  }

  .section-nav-tick.is-active {
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
    pointer-events: none;
  }

  .section-nav a:hover .section-nav-tooltip,
  .section-nav a:focus-visible .section-nav-tooltip {
    opacity: 1;
  }

  .section-nav a:hover .section-nav-tick:not(.is-active),
  .section-nav a:focus-visible .section-nav-tick:not(.is-active) {
    background: var(--color-ink-muted);
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
    .section-nav-tick {
      transition: none;
    }
  }
</style>
