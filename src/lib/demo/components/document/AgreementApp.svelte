<script lang="ts">
	import '$lib/styles/marketing.css';
	import { AgreementSession } from '$lib/demo/document/agreement-session.svelte';
	import { AnnotationSession } from '$lib/demo/document/annotations/annotation-session.svelte';
	import { DiscussionSession } from '$lib/demo/document/discussions/discussion-session.svelte';
	import type { CompiledAgreement } from '$lib/demo/document/agreement-model';
	import AgreementViewer from './AgreementViewer.svelte';

	let { agreement }: {
		agreement: CompiledAgreement;
	} = $props();
	const agreementSession = new AgreementSession();
	const annotationSession = new AnnotationSession();
	const discussionSession = new DiscussionSession();
</script>

<section
	class="workspace block h-full min-w-full"
	aria-label="Agreement document"
>
	<AgreementViewer
		{agreement}
		session={agreementSession}
		annotations={annotationSession}
		discussion={discussionSession}
	/>
</section>
