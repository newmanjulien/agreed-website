import { agreementResult } from '$lib/demo/server/load-agreement';
import { createFeaturePreviewContent } from '$lib/components/features/feature-preview-content';
import type { PageServerLoad } from './$types';

export const load = (() => ({
	agreementResult,
	featurePreviewContent: agreementResult.ok
		? createFeaturePreviewContent(agreementResult.agreement)
		: null
})) satisfies PageServerLoad;
