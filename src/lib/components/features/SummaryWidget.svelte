<script lang="ts">
	import ContractFeatureDemo from './demo/ContractFeatureDemo.svelte';
	import { summaryDemo, summaryTour } from './summary/summary-tour';
</script>

<ContractFeatureDemo
	name="summary"
	scene={summaryDemo}
	tour={summaryTour}
	label="A cursor clicks the Resale clause, revealing its plain English explanation, then opens How to negotiate and pauses to read the guidance. The guidance stays open."
	fallback="Agreed explains each clause in plain English."
/>
