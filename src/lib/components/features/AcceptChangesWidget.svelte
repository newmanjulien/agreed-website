<script lang="ts">
	import ContractFeatureDemo from './demo/ContractFeatureDemo.svelte';
	import { acceptDemo, acceptChangesTour } from './accept/accept-changes-tour';
</script>

<ContractFeatureDemo
	name="accept"
	scene={acceptDemo}
	tour={acceptChangesTour}
	label="A cursor clicks the Resale clause, opens Preferred concession, then clicks Apply concession. The preapproved change appears in the contract."
	fallback="Reps can apply preapproved concessions directly to the contract."
/>
