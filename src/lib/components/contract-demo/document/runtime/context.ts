import { getContext, setContext } from 'svelte';
import { createContractSource, type ContractSourceInput } from './source';
import { ContractViewerState } from './viewer.svelte';
import { ContractRenderController } from './renderer.svelte';

const CONTRACT = Symbol('contract-demo');
export function createContractContext(initial: ContractSourceInput) {
	return {
		source: createContractSource(initial),
		renderer: new ContractRenderController(),
		viewer: new ContractViewerState()
	};
}
type ContractContext = ReturnType<typeof createContractContext>;
export function setContractContext(context: ContractContext) {
	return setContext(CONTRACT, context);
}
export function getContractContext(): ContractContext {
	const context = getContext<ContractContext>(CONTRACT);
	if (!context) throw new Error('Contract demo context is required.');
	return context;
}
