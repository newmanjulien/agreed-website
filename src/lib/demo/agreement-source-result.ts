import type { CompiledAgreement } from './document/agreement-model.ts';

export interface AgreementSourceIssue {
	code: string;
	message: string;
	line?: number;
	column?: number;
}

export type AgreementCompileResult =
	| { ok: true; agreement: CompiledAgreement }
	| { ok: false; kind: 'source'; issues: AgreementSourceIssue[] };

export type AgreementLoadResult =
	| AgreementCompileResult
	| { ok: false; kind: 'internal'; issues: AgreementSourceIssue[] };
