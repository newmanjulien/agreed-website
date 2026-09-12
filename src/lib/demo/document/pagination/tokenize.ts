import type { TextNode } from '../types';
import type { ResolvedInlineNode } from '../resolve-agreement';
import type { InlineToken } from './types';

const TEXT_CHUNK = /\S+\s*|\s+/gu;

export function tokenizeInline(nodes: ResolvedInlineNode[] | TextNode[]): InlineToken[] {
	const tokens: InlineToken[] = [];

	function append(
		nodesToTokenize: Array<ResolvedInlineNode | TextNode>,
		clauseId?: string,
		isClauseInactive?: boolean
	) {
		for (const node of nodesToTokenize) {
			if (node.type === 'clause') {
				const clauseStart = tokens.length;
				append(node.content, node.id, node.isClauseInactive);
				if (tokens[clauseStart]) tokens[clauseStart].isClauseStart = true;
				continue;
			}

			for (const value of node.value.match(TEXT_CHUNK) ?? []) {
				tokens.push({
					type: 'text',
					value,
					...(clauseId ? { clauseId } : {}),
					...(isClauseInactive ? { isClauseInactive: true } : {}),
					...(node.marks ? { marks: { ...node.marks } } : {})
				});
			}
		}
	}

	append(nodes);
	return tokens;
}
