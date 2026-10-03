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
  const shapeClasses = { default: 'rounded-[8px]', pill: 'rounded-full' };
  const sizeClasses = {
    small: 'h-[40px] px-[14px] text-[14px]',
    medium: 'h-[44px] px-[14px] text-[14px]',
    large: 'h-[48px] px-[23px] text-[16px]',
    xlarge: 'h-[58px] px-[26px] text-[17px]'
  };
  const variantClasses = {
    primary: 'bg-ink text-white hover:bg-ink/90',
    secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
    soft: 'bg-canvas text-ink hover:bg-hover hover:text-ink'
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
    highlightSweep && "button-link-highlight-sweep relative overflow-hidden after:pointer-events-none after:absolute after:-inset-y-[40%] after:-left-[55%] after:w-[42%] after:content-[''] motion-reduce:hover:after:animate-none",
    className
  ]}
>
  {@render children()}
</a>

<style>
  @layer components {
    .button-link-highlight-sweep::after {
      transform: skewX(-24deg);
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.04) 24%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.04) 76%, transparent 100%);
    }

    .button-link-highlight-sweep:hover::after {
      animation: button-link-highlight-sweep 1160ms cubic-bezier(0.22, 1, 0.36, 1) 160ms;
    }

    @keyframes button-link-highlight-sweep {
      to { transform: skewX(-24deg) translateX(430%); }
    }
  }
</style>
