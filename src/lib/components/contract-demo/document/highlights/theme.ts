export const HIGHLIGHT_THEME = {
	trigger: { priority: 0 },
	'revision-added': { priority: 1 },
	'revision-removed': { priority: 1 }
} as const;

export type HighlightKind = keyof typeof HIGHLIGHT_THEME;
