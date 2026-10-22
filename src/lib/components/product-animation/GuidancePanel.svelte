<script lang="ts">
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
	import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
	import PlaybookText from './PlaybookText.svelte';
	import type { PreparedPanel } from './model';
	let { panel, openSection, selected }: { panel: PreparedPanel; openSection?: string | null; selected?: string } = $props();
</script>

<aside class="guidance-panel" data-guidance-panel>
	<div class="panel-content">
		<div class="summary"><PlaybookText text={panel.summary} /></div>
		{#if panel.sections.length}
			<div class="sections">
				{#each panel.sections as section}
					<div>
						<div class="section-heading" class:danger={section.key === 'rare'} data-section={section.key}>
							<span>{section.label}</span>
							{#if section.key === 'preferred' && panel.important}<InfoIcon size={18} class="text-accent" />{/if}
							<CaretDownIcon size={14} weight="bold" class={`caret ${openSection === section.key ? 'expanded' : ''}`} />
						</div>
						{#if openSection === section.key}
							<div class="section-body" data-section-body={section.key}>
								{#if section.text}<PlaybookText text={section.text} />{/if}
								{#each section.concessions ?? [] as concession}
									<p>{concession.description}{' '}<span class="inline-action" class:applied={selected === concession.id} data-concession-id={concession.id}>{selected === concession.id ? 'Remove concession' : 'Apply concession'}</span></p>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</aside>

<style>
	.guidance-panel { max-height: calc(var(--stage-height) - 48px); width: 100%; overflow: hidden; border: 1px solid var(--color-line); border-radius: 14px; background: white; padding: 14px; font-size: 15px; line-height: 1.45; color: var(--color-ink-muted); }
	.panel-content, .summary, .section-body { display: flex; flex-direction: column; gap: 12px; }
	.sections { display: flex; flex-direction: column; gap: 8px; }
	.section-heading { display: flex; align-items: center; gap: 6px; border-radius: 12px; padding: 10px 12px; background: var(--color-canvas); color: var(--color-ink); line-height: 1.3; }
	.section-heading.danger { background: var(--color-danger-surface); color: var(--color-danger); }
	.section-heading :global(.caret) { flex-shrink: 0; margin-left: auto; opacity: .25; }
	.section-heading :global(.expanded) { transform: rotate(180deg); }
	.section-body { margin: 8px 0 4px; padding: 0 4px; }
	.section-body p { margin: 0; }
	.inline-action { color: var(--color-accent); border-bottom: 1px dotted var(--color-accent); }
	.inline-action.applied { color: var(--color-danger); border-color: var(--color-danger); }
	:global(.product-animation.is-mobile) .guidance-panel { max-height: calc(var(--stage-height) - 140px); font-size: 14px; padding: 12px; box-shadow: 0 8px 24px rgb(32 33 36 / 12%); }
</style>
