import type { ContractChange, PlaybookItemRecord, SourceRange, Trigger } from './model.ts';

export interface AnnotationMembership {
	id: string;
	kind: 'trigger';
	itemId: string;
	triggerId: string;
	range: SourceRange;
}
export const triggerAnnotationId = (itemId: string, triggerId: string) => JSON.stringify(['trigger', itemId, triggerId]);

export type DocumentOverlayItem = {
	itemId: string;
	annotations: AnnotationMembership[];
	triggers: Trigger[];
	concessions: { id: string; changes: ContractChange[] }[];
};

/** Only this projection may contribute Playbook data to render-source identity. */
export function toDocumentOverlay(record: PlaybookItemRecord): DocumentOverlayItem {
	return {
		itemId: record._id,
		annotations: record.triggers.map((trigger) => ({ id: triggerAnnotationId(record._id, trigger.id), kind: 'trigger', itemId: record._id, triggerId: trigger.id, range: trigger.range })),
		triggers: record.triggers,
		concessions: record.concessions.map(({ id, changes }) => ({ id, changes }))
	};
}
