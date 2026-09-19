<script lang="ts">
	import { uploadFile, type UploadFileKind } from './upload-changes-tour';

	let { kind }: { kind: UploadFileKind } = $props();

	let file = $derived(uploadFile(kind));
</script>

<div class="upload-file">
	<div class="upload-file-card">
		{#if kind === 'screenshot'}
			<svg viewBox="0 0 40 48" width="28" height="34" aria-hidden="true">
				<rect
					x="5.5"
					y="6.5"
					width="29"
					height="35"
					rx="5"
					fill="var(--color-demo-surface)"
					stroke="var(--color-demo-ink-muted)"
					stroke-width="1.7"
				/>
				<path d="M10 14h20" stroke="var(--color-demo-line-strong)" stroke-width="1.6" stroke-linecap="round" />
				<path d="M10 20h13" stroke="var(--color-demo-accent)" stroke-width="1.6" stroke-linecap="round" />
				<path d="M10 26h18" stroke="var(--color-demo-line-strong)" stroke-width="1.6" stroke-linecap="round" />
				<path d="M10 32h15" stroke="var(--color-demo-line-strong)" stroke-width="1.6" stroke-linecap="round" />
			</svg>
		{:else if kind === 'recording'}
			<svg viewBox="0 0 40 48" width="28" height="34" aria-hidden="true">
				<rect
					x="5.5"
					y="6.5"
					width="29"
					height="35"
					rx="5"
					fill="var(--color-demo-surface)"
					stroke="var(--color-demo-ink-muted)"
					stroke-width="1.7"
				/>
				<path
					d="M13 28v-4M17 31V17M21 29V19M25 32V16M29 27v-3"
					stroke="var(--color-demo-accent)"
					stroke-width="1.8"
					stroke-linecap="round"
				/>
			</svg>
		{:else}
			<svg viewBox="0 0 40 48" width="28" height="34" aria-hidden="true">
				<path
					d="M7 2.5h17.2L33.5 12v33.5H7V2.5Z"
					fill="var(--color-demo-surface)"
					stroke="var(--color-demo-ink-muted)"
					stroke-width="1.7"
					stroke-linejoin="round"
				/>
				<path
					d="M24.2 2.5V12H33.5"
					fill="none"
					stroke="var(--color-demo-ink-muted)"
					stroke-width="1.7"
					stroke-linejoin="round"
				/>
				<path d="M12 20h16" stroke="var(--color-demo-line-strong)" stroke-width="1.6" stroke-linecap="round" />
				<path d="M12 25.5h11" stroke="var(--color-demo-danger)" stroke-width="1.6" stroke-linecap="round" />
				<path d="M12 31h14" stroke="var(--color-demo-line-strong)" stroke-width="1.6" stroke-linecap="round" />
				<path d="M12 36.5h8" stroke="var(--color-demo-danger)" stroke-width="1.6" stroke-linecap="round" />
			</svg>
		{/if}

		<div class="upload-file-copy">
			<span class="upload-file-name">{file.name}</span>
			<span class="upload-file-meta">{file.meta}</span>
		</div>
	</div>
</div>

<style>
	.upload-file {
		position: absolute;
		left: 14px;
		top: 18px;
		transform: rotate(-4deg);
		pointer-events: none;
	}

	.upload-file-card {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 10px 7px 8px;
		border: 1px solid rgb(231 229 228);
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-demo-surface) 92%, transparent);
		box-shadow:
			0 16px 28px -14px rgba(41, 37, 36, 0.5),
			0 1px 0 rgba(48, 47, 45, 0.04);
		backdrop-filter: blur(8px);
	}

	.upload-file-copy {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 1px;
	}

	.upload-file-name {
		font-size: 12px;
		font-weight: 500;
		line-height: 1.2;
		letter-spacing: -0.15px;
		color: var(--color-demo-ink);
		white-space: nowrap;
	}

	.upload-file-meta {
		font-size: 10.5px;
		line-height: 1.2;
		color: var(--color-demo-ink-muted);
		white-space: nowrap;
	}
</style>
