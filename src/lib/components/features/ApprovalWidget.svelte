<script lang="ts">
	import ContractFeatureDemo from './demo/ContractFeatureDemo.svelte';
	import { approvalTour } from './approval/approval-tour';
</script>

<ContractFeatureDemo
	tour={approvalTour}
	label="A cursor moves to and clicks Ask for approval beneath a contract with a change that needs approval. Send to buyer stays disabled until the change is approved."
/>
