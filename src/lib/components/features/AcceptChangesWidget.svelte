<script lang="ts">
	import ContractFeatureDemo from './demo/ContractFeatureDemo.svelte';
	import { acceptChangesTour } from './accept/accept-changes-tour';
</script>

<ContractFeatureDemo
	tour={acceptChangesTour}
	label="A cursor clicks the Resale clause, opens Preferred concession, then clicks Apply concession. The preapproved change appears in the contract."
/>
