<script lang="ts">
	import ContractFeatureDemo from './demo/ContractFeatureDemo.svelte';
	import { approvalDemo, approvalTour } from './approval/approval-tour';
</script>

<ContractFeatureDemo
	name="approval"
	scene={approvalDemo}
	tour={approvalTour}
	label="A cursor moves to and clicks Ask for approval beneath a contract with a change that needs approval. Send to buyer stays disabled until the change is approved."
	fallback="Reps can request approval when a contract change requires it."
/>
