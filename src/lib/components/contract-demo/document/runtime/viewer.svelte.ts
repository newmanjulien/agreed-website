/** DOM access shared with the guidance panel for focus restoration. */
export class ContractViewerState {
	documentStageElement = $state<HTMLDivElement>();
	restoreAnnotationFocus = $state<() => void>();
}
