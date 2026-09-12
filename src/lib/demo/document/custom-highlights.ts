interface HighlightLike {
	priority: number;
}

interface HighlightRegistryLike {
	delete(name: string): boolean;
	set(name: string, highlight: HighlightLike): void;
}

type HighlightConstructor = new (...ranges: Range[]) => HighlightLike;

export type CustomHighlightOwner = symbol;

interface OwnedHighlight {
	ranges: Range[];
	priority: number;
}

const highlightsByName = new Map<string, Map<CustomHighlightOwner, OwnedHighlight>>();

function getHighlightApi(): {
	registry: HighlightRegistryLike;
	HighlightClass: HighlightConstructor;
} | null {
	if (typeof CSS === 'undefined') return null;

	const registry = (CSS as typeof CSS & { highlights?: HighlightRegistryLike }).highlights;
	const HighlightClass = (globalThis as typeof globalThis & {
		Highlight?: HighlightConstructor;
	}).Highlight;

	if (!registry || !HighlightClass) return null;
	return { registry, HighlightClass };
}

export function customHighlightsSupported(): boolean {
	return getHighlightApi() !== null;
}

export function createCustomHighlightOwner(): CustomHighlightOwner {
	return Symbol('agreed-custom-highlight-owner');
}

function renderCustomHighlight(name: string) {
	const api = getHighlightApi();
	if (!api) return;

	const ownedHighlights = highlightsByName.get(name);
	if (!ownedHighlights || ownedHighlights.size === 0) {
		api.registry.delete(name);
		return;
	}

	const highlights = Array.from(ownedHighlights.values());
	const highlight = new api.HighlightClass(...highlights.flatMap(({ ranges }) => ranges));
	highlight.priority = Math.max(...highlights.map(({ priority }) => priority));
	api.registry.set(name, highlight);
}

export function clearCustomHighlights(owner: CustomHighlightOwner, ...names: string[]) {
	for (const name of names) {
		const ownedHighlights = highlightsByName.get(name);
		if (!ownedHighlights) continue;

		ownedHighlights.delete(owner);
		if (ownedHighlights.size === 0) highlightsByName.delete(name);
		renderCustomHighlight(name);
	}
}

export function setCustomHighlight(
	owner: CustomHighlightOwner,
	name: string,
	ranges: Range[],
	priority: number
) {
	if (!getHighlightApi() || ranges.length === 0) return;

	let ownedHighlights = highlightsByName.get(name);
	if (!ownedHighlights) {
		ownedHighlights = new Map();
		highlightsByName.set(name, ownedHighlights);
	}
	ownedHighlights.set(owner, { ranges, priority });
	renderCustomHighlight(name);
}
