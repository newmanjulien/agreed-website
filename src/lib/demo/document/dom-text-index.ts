export interface TextPoint {
	node: Node;
	offset: number;
}

export interface IndexedTextBlock {
	id: string;
	text: string;
	starts: TextPoint[];
	ends: TextPoint[];
}

const TEXT_BLOCK_SELECTOR = '[data-block-id]';

function isIndexableTextNode(node: Text): boolean {
	const parent = node.parentElement;
	if (!parent || !node.data) return false;
	return !parent.closest('[aria-hidden="true"], script, style');
}

function appendCharacter(
	block: IndexedTextBlock,
	character: string,
	start: TextPoint,
	end: TextPoint,
	lowercase: boolean
) {
	const normalized = lowercase ? character.toLocaleLowerCase() : character;
	for (let index = 0; index < normalized.length; index += 1) {
		block.text += normalized[index];
		block.starts.push(start);
		block.ends.push(end);
	}
}

function appendTextNode(block: IndexedTextBlock, node: Text, lowercase: boolean) {
	let offset = 0;

	for (const character of node.data) {
		const nextOffset = offset + character.length;
		const start = { node, offset };
		const end = { node, offset: nextOffset };

		if (/\s/u.test(character)) {
			if (block.text && !block.text.endsWith(' ')) {
				appendCharacter(block, ' ', start, end, lowercase);
			}
		} else {
			appendCharacter(block, character, start, end, lowercase);
		}

		offset = nextOffset;
	}
}

function collectBlockText(block: IndexedTextBlock, element: HTMLElement, lowercase: boolean) {
	const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	let node = walker.nextNode();

	while (node) {
		if (node instanceof Text && isIndexableTextNode(node)) appendTextNode(block, node, lowercase);
		node = walker.nextNode();
	}
}

export function indexDocumentText(
	root: HTMLElement,
	options: { lowercase?: boolean } = {}
): IndexedTextBlock[] {
	const blocks = new Map<string, IndexedTextBlock>();

	for (const element of root.querySelectorAll<HTMLElement>(TEXT_BLOCK_SELECTOR)) {
		const id = element.dataset.blockId;
		if (!id) continue;

		let block = blocks.get(id);
		if (!block) {
			block = { id, text: '', starts: [], ends: [] };
			blocks.set(id, block);
		}

		collectBlockText(block, element, options.lowercase ?? false);
	}

	return Array.from(blocks.values());
}

export function compareTextPoints(document: Document, first: TextPoint, second: TextPoint): number {
	const firstRange = document.createRange();
	const secondRange = document.createRange();
	firstRange.setStart(first.node, first.offset);
	firstRange.collapse(true);
	secondRange.setStart(second.node, second.offset);
	secondRange.collapse(true);
	return firstRange.compareBoundaryPoints(Range.START_TO_START, secondRange);
}

export function rangeFromIndexedTextBlock(
	root: HTMLElement,
	block: IndexedTextBlock,
	start: number,
	end: number
): Range | null {
	if (start < 0 || end > block.text.length || start >= end) return null;

	const startPoint = block.starts[start];
	const endPoint = block.ends[end - 1];
	if (!startPoint || !endPoint) return null;

	const range = root.ownerDocument.createRange();
	range.setStart(startPoint.node, startPoint.offset);
	range.setEnd(endPoint.node, endPoint.offset);
	return range;
}
