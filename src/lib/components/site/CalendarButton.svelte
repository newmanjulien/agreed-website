<script lang="ts">
  import { tick } from 'svelte';
  import { CalendarBlankIcon } from 'phosphor-svelte';

  const GAP = 20;
  const BOOK_URL = 'https://cal.com/juliennewman/julien?user=juliennewman';

  let bottom = $state(GAP);
  let open = $state(false);
  let trigger = $state<HTMLButtonElement>();
  let link = $state<HTMLAnchorElement>();

  $effect(() => {
    const footer = document.querySelector('#site-footer');
    if (!footer) return;

    const update = () => {
      const rect = footer.getBoundingClientRect();
      const anchor = rect.top + rect.height * 0.1;
      bottom = Math.max(GAP, window.innerHeight - anchor);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  });

  async function show() {
    open = true;
    await tick();
    link?.focus({ preventScroll: true });
  }

  async function close() {
    open = false;
    await tick();
    trigger?.focus({ preventScroll: true });
  }
</script>

<div
  class="fixed right-5 lg:right-[42px]"
  class:z-layer-chrome={!open}
  class:z-layer-chrome-popover={open}
  style="bottom: {bottom}px"
>
  <button
    bind:this={trigger}
    type="button"
    class="grid size-11 cursor-pointer place-items-center rounded-[8px] border border-line bg-surface text-ink shadow-[0_1px_2px_rgba(32,33,36,0.04),0_4px_14px_rgba(32,33,36,0.08)] transition-[background-color,box-shadow] duration-200 ease-out hover:bg-canvas hover:shadow-[0_2px_4px_rgba(32,33,36,0.05),0_6px_18px_rgba(32,33,36,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
    class:invisible={open}
    inert={open}
    aria-label="Book a demo"
    aria-expanded={open}
    onclick={show}
  >
    <CalendarBlankIcon size={23} weight="fill" aria-hidden="true" />
  </button>

  {#if open}
    <div
      class="book-demo-card absolute right-0 bottom-0 w-[160px] overflow-hidden rounded-[9px] border border-[#cdced6] bg-surface text-[#1c2024] shadow-[0_2px_3px_rgba(28,25,23,0.04),0_8px_18px_-8px_rgba(28,25,23,0.16)] has-[a:focus-visible]:outline has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-black"
    >
      <a
        bind:this={link}
        href={BOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col text-inherit no-underline"
      >
        <div class="flex min-h-[110px] flex-col items-start gap-[10px] p-4">
          <CalendarBlankIcon class="size-[22px] shrink-0" weight="fill" aria-hidden="true" />
          <span class="font-heading text-[22px] leading-[1.1] tracking-[-0.035em]">
            <span class="block">Book a</span>
            <span class="block">demo</span>
          </span>
        </div>
        <span class="flex min-h-[44px] items-center justify-between gap-3 border-t border-[#cdced6] px-4 py-3 text-[13px] leading-[1.3] tracking-[-0.02em]">
          Choose a time
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="book-demo-arrow shrink-0" aria-hidden="true">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </span>
      </a>
      <button
        type="button"
        class="absolute top-2 right-2 z-10 grid size-6 cursor-pointer place-items-center rounded-full text-[#60646c] transition-colors duration-150 hover:bg-[#e8e8ec] hover:text-[#1c2024] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        aria-label="Close"
        onclick={close}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <path d="m4 4 8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  {/if}
</div>

<style>
  .book-demo-card {
    transform-origin: bottom right;
    animation: book-demo-card-enter 196ms cubic-bezier(0.23, 1, 0.32, 1);
    transition: border-color 200ms ease-out;
  }

  .book-demo-card:hover {
    border-color: #60646c;
  }

  .book-demo-arrow {
    transition: transform 200ms ease-out;
  }

  .book-demo-card:hover .book-demo-arrow {
    transform: translate(2px, -2px);
  }

  @keyframes book-demo-card-enter {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .book-demo-card {
      animation: none;
    }

    .book-demo-arrow,
    .book-demo-card:hover .book-demo-arrow {
      transition: none;
      transform: none;
    }
  }
</style>
