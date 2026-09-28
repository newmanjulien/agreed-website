<script lang="ts">
	import { uploadFile } from './upload-changes-tour';
</script>

<div class="upload-file">
	<div class="upload-file-card">
		<svg viewBox="0 0 40 48" width="28" height="34" aria-hidden="true">
			<rect
				x="5.5"
				y="6.5"
				width="29"
				height="35"
				rx="5"
				fill="var(--color-surface)"
				stroke="var(--color-ink-muted)"
				stroke-width="1.7"
			/>
			<path d="M10 14h20" stroke="var(--color-line-strong)" stroke-width="1.6" stroke-linecap="round" />
			<path d="M10 20h13" stroke="var(--color-accent)" stroke-width="1.6" stroke-linecap="round" />
			<path d="M10 26h18" stroke="var(--color-line-strong)" stroke-width="1.6" stroke-linecap="round" />
			<path d="M10 32h15" stroke="var(--color-line-strong)" stroke-width="1.6" stroke-linecap="round" />
		</svg>

		<div class="upload-file-copy">
			<span class="upload-file-name">{uploadFile.name}</span>
			<span class="upload-file-meta">{uploadFile.meta}</span>
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
		border: 1px solid var(--color-line);
		border-radius: 10px;
		background: color-mix(in srgb, var(--color-surface) 92%, transparent);
		box-shadow:
			0 16px 28px -14px color-mix(in srgb, var(--color-ink) 50%, transparent),
			0 1px 0 color-mix(in srgb, var(--color-ink) 4%, transparent);
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
		color: var(--color-ink);
		white-space: nowrap;
	}

	.upload-file-meta {
		font-size: 10.5px;
		line-height: 1.2;
		color: var(--color-ink-muted);
		white-space: nowrap;
	}
</style>
