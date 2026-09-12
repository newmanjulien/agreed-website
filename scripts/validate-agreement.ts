import { readFile } from 'node:fs/promises';
import { agreementClauses } from '../src/lib/demo/content/agreement/clauses.ts';
import { compileAgreementSource } from '../src/lib/demo/server/agreement-source/compile-agreement.ts';
import { createFeaturePreviewContent } from '../src/lib/components/features/feature-preview-content.ts';

const sourceUrl = new URL('../src/lib/demo/content/agreement/document.html', import.meta.url);
const source = await readFile(sourceUrl, 'utf8');
const result = compileAgreementSource(source, agreementClauses);

if (!result.ok) {
  console.error('Agreement source validation failed:');
  for (const issue of result.issues) {
    const location = issue.line && issue.column ? `${issue.line}:${issue.column}` : 'document';
    console.error(`  ${location} ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  try {
    createFeaturePreviewContent(result.agreement);
  } catch (error) {
    console.error('Feature preview validation failed:');
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
