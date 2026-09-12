import type { AgreementLoadResult } from '$lib/demo/agreement-source-result';
import { agreementClauses } from '$lib/demo/content/agreement/clauses';
import agreementSource from '$lib/demo/content/agreement/document.html?raw';
import { compileAgreementSource } from './agreement-source/compile-agreement';

export const agreementResult: AgreementLoadResult = (() => {
	try {
		return compileAgreementSource(agreementSource, agreementClauses);
	} catch (error) {
		console.error('Agreement compiler failed unexpectedly.', error);
		return {
			ok: false,
			kind: 'internal',
			issues: [
				{
					code: 'internal-compiler-error',
					message: 'The agreement compiler encountered an unexpected error.'
				}
			]
		};
	}
})();
