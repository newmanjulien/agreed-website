<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes } from 'svelte/elements';

  type ButtonLinkProps = Omit<HTMLAnchorAttributes, 'href' | 'children'> & {
    href: string;
    variant: 'primary' | 'secondary' | 'soft';
    size: 'small' | 'medium' | 'large' | 'xlarge';
    shape?: 'default' | 'pill';
    fullWidth?: boolean;
    highlightSweep?: boolean;
    children: Snippet;
  };

  let {
    variant,
    size,
    shape = 'default',
    fullWidth = false,
    highlightSweep = false,
    children,
    class: className,
    ...anchorProps
  }: ButtonLinkProps = $props();

  const baseClasses =
    'inline-flex items-center justify-center font-book leading-none transition-colors duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black';
  const shapeClasses = { default: 'rounded-[9px]', pill: 'rounded-full' };
  const sizeClasses = {
    small: 'h-[36px] px-[14px] text-[14px]',
    medium: 'h-[42px] px-[14px] text-[14px]',
    large: 'h-[48px] px-[23px] text-[16px]',
    xlarge: 'h-[64px] px-[28px] text-[19px]'
  };
  const variantClasses = {
    primary: 'bg-stone-750 text-white hover:bg-stone-700',
    secondary: 'border border-stone-300 bg-white text-black hover:bg-stone-50',
    soft: 'bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900'
  };
</script>

<a
  {...anchorProps}
  class={[
    baseClasses,
    shapeClasses[shape],
    sizeClasses[size],
    variantClasses[variant],
    fullWidth && 'w-full',
    highlightSweep && 'button-link-highlight-sweep relative overflow-hidden',
    className
  ]}
>
  {@render children()}
</a>

<style>
  .button-link-highlight-sweep::after {
    content: '';
    position: absolute;
    inset: -40% auto -40% -55%;
    width: 42%;
    transform: skewX(-24deg);
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.04) 24%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.04) 76%, transparent 100%);
    pointer-events: none;
  }

  .button-link-highlight-sweep:hover::after {
    animation: button-link-highlight-sweep 1160ms cubic-bezier(0.22, 1, 0.36, 1) 160ms;
  }

  @keyframes button-link-highlight-sweep {
    to { transform: skewX(-24deg) translateX(430%); }
  }

  @media (prefers-reduced-motion: reduce) {
    .button-link-highlight-sweep:hover::after { animation: none; }
  }
</style>
