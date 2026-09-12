import type { InlineToken, PageFragment } from './types';
import { PAGE_FORMAT } from './page-format.ts';

export interface PageMeasurement {
	fits(fragments: PageFragment[], pageIndex: number): boolean;
}

function appendInlineTokens(container: HTMLElement, tokens: InlineToken[]) {
	for (const token of tokens) {
		let node: Node = document.createTextNode(token.value);
		if (token.marks?.italic) {
			const emphasis = document.createElement('em');
			emphasis.appendChild(node);
			node = emphasis;
		}
		if (token.marks?.bold) {
			const strong = document.createElement('strong');
			strong.appendChild(node);
			node = strong;
		}
		container.appendChild(node);
	}
}

function createFragmentElement(fragment: PageFragment): HTMLElement {
	if (fragment.type === 'heading') {
		const heading = document.createElement(`h${fragment.level}`);
		heading.className = 'agreement-block agreement-heading';
		heading.dataset.blockId = fragment.blockKey;
		appendInlineTokens(heading, fragment.tokens);
		return heading;
	}

	if (fragment.type === 'paragraph') {
		const paragraph = document.createElement('p');
		paragraph.className = 'agreement-block agreement-paragraph';
		paragraph.classList.toggle('is-continuation', fragment.isContinuation);
		paragraph.classList.toggle('is-final', fragment.isFinal);
		paragraph.dataset.blockId = fragment.blockKey;
		appendInlineTokens(paragraph, fragment.tokens);
		return paragraph;
	}

	const signatures = document.createElement('section');
	signatures.className = 'agreement-block agreement-signatures';
	signatures.dataset.blockId = fragment.blockKey;

	const title = document.createElement('h2');
	title.textContent = fragment.title;
	signatures.appendChild(title);

	const grid = document.createElement('div');
	grid.className = 'signature-grid';
	for (const party of fragment.parties) {
		const block = document.createElement('div');
		block.className = 'signature-block';

		const name = document.createElement('h3');
		name.textContent = party.name;
		block.appendChild(name);

		for (const field of party.fields) {
			const row = document.createElement('p');
			row.append(`${field.label}: `);
			const value = document.createElement('span');

			if (field.kind === 'signature-line') {
				value.className = 'signature-line';
			} else {
				value.textContent = field.value ?? '';
				if (field.marks?.bold) value.style.fontWeight = '600';
				if (field.marks?.italic) value.style.fontStyle = 'italic';
			}

			row.appendChild(value);
			block.appendChild(row);
		}

		grid.appendChild(block);
	}

	signatures.appendChild(grid);
	return signatures;
}

export function createPageMeasurement(
	surface: HTMLElement
): PageMeasurement {
	return {
		fits(fragments, pageIndex) {
			surface.replaceChildren(...fragments.map(createFragmentElement));

			const topPadding =
				pageIndex === 0 ? PAGE_FORMAT.firstTopPadding : PAGE_FORMAT.topPadding;
			const capacity = PAGE_FORMAT.height - topPadding - PAGE_FORMAT.bottomPadding;
			return surface.scrollHeight <= capacity + 0.5;
		}
	};
}
