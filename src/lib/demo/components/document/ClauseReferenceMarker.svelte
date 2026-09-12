<script lang="ts">
	import { CLAUSE_REFERENCE_DURATION_MS } from '$lib/demo/document/clause-reference';
</script>

<span
	class="clause-reference-marker pointer-events-none absolute -top-[3px] -bottom-[3px] -left-2.5 z-[1] w-0.5 rounded-full bg-demo-accent"
	style:--clause-reference-duration={`${CLAUSE_REFERENCE_DURATION_MS}ms`}
	aria-hidden="true"
></span>

<style>
	.clause-reference-marker {
		animation: clause-reference-marker-lifetime var(--clause-reference-duration) ease both;
	}

	@keyframes clause-reference-marker-lifetime {
		0% {
			opacity: 0;
		}
		8%,
		82% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.clause-reference-marker {
			animation: none;
		}
	}
</style>
