<script lang="ts">
	import ContractFeatureDemo from './demo/ContractFeatureDemo.svelte';
	import { approvalDemo, approvalTour } from './approval/approval-tour';
</script>

<ContractFeatureDemo
	name="approval"
	scene={approvalDemo}
	tour={approvalTour}
	label="A cursor moves to and clicks Send to buyer beneath a contract with a preapproved change."
	fallback="Once the terms are agreed, reps can send the contract to the buyer with a single click."
/>
