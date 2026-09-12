<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import ChatCenteredTextIcon from 'phosphor-svelte/lib/ChatCenteredTextIcon';
	import EraserIcon from 'phosphor-svelte/lib/EraserIcon';
	import SquareIconButton from '$lib/demo/components/ui/SquareIconButton.svelte';

	let { registerTarget }: {
		registerTarget: (name: string, element: Element | null) => void;
	} = $props();

	const attachCommentAction: Attachment = (node) => {
		registerTarget('comment-action', node);
		return () => registerTarget('comment-action', null);
	};
</script>

<div class="selection-actions" role="group" aria-label="Text selection actions">
	<div {@attach attachCommentAction}>
		<SquareIconButton type="button" aria-label="Add comment" tabindex={-1}>
			<ChatCenteredTextIcon aria-hidden="true" size={20} weight="regular" />
		</SquareIconButton>
	</div>
	<div>
		<SquareIconButton type="button" aria-label="Propose change" tabindex={-1}>
			<EraserIcon aria-hidden="true" size={20} weight="regular" />
		</SquareIconButton>
	</div>
</div>

<style>
	.selection-actions {
		--action-size: 26px;
		--actions-padding: 2px;
		--actions-border-width: 1px;
		display: flex;
		box-sizing: border-box; width: 58px; height: 31px; align-items: center; padding: var(--actions-padding);
		border: var(--actions-border-width) solid var(--color-demo-line); border-radius: var(--radius-demo-popover);
		background: var(--color-demo-surface); box-shadow: none;
	}
	.selection-actions > div { display: flex; }
	.selection-actions :global(button) { width: var(--action-size); height: 25px; }
</style>
