/** Yield between layout slices; a single native layout read may exceed the budget. */
export const PROCESSING_BUDGET_MS = 8;
export function yieldToBrowser(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0));
}
