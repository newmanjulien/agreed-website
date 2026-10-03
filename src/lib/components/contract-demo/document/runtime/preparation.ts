import { ContractCompositionEngine } from '../../contract/compose';
import { LayoutPreparationEngine } from '../pagination/prepare';
import type { ContractRenderSource } from './types';
import type { ConcessionSelection } from '../../playbook/model';

const pipelines = new WeakMap<ContractRenderSource, {
	composition: ContractCompositionEngine;
	preparation: LayoutPreparationEngine;
}>();

/** Only caches are shared. Each call produces immutable content for its own selection. */
export function prepareDocument(source: ContractRenderSource, concessions: ConcessionSelection) {
	let pipeline = pipelines.get(source);
	if (!pipeline) {
		pipeline = {
			composition: new ContractCompositionEngine(source.blocks, source.sourceIndex),
			preparation: new LayoutPreparationEngine()
		};
		pipelines.set(source, pipeline);
	}
	return pipeline.composition.compose({ items: source.items, activeConcessions: concessions })
		.map(block => pipeline.preparation.prepare(block));
}
