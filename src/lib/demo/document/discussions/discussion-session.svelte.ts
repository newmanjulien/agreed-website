import type {
	DiscussionComposerState,
	DiscussionReply,
	DiscussionRootDeletionState,
	DiscussionTarget
} from './types';
import { discussionTargetsEqual } from './types';

let fallbackOperationId = 0;

export class DiscussionSession {
	composer = $state<DiscussionComposerState | null>(null);
	rootDeletion = $state<DiscussionRootDeletionState | null>(null);

	#rootDeletionOperationId: string | null = null;

	startReply(target: DiscussionTarget) {
		this.beginInteraction(target);
		this.composer = {
			id: createOperationId('discussion-composer'),
			mode: 'reply',
			target,
			text: '',
			submission: { status: 'idle' }
		};
	}

	startRootEdit(target: DiscussionTarget, message: { text: string }) {
		this.beginInteraction(target);
		this.composer = {
			id: createOperationId('discussion-composer'),
			mode: 'edit-root',
			target,
			text: message.text,
			submission: { status: 'idle' }
		};
	}

	startReplyEdit(target: DiscussionTarget, reply: DiscussionReply) {
		this.beginInteraction(target);
		this.composer = {
			id: createOperationId('discussion-composer'),
			mode: 'edit-reply',
			target,
			replyId: reply.id,
			text: reply.text,
			submission: { status: 'idle' }
		};
	}

	updateText(text: string) {
		if (!this.composer || this.composer.submission.status === 'pending') return;
		this.composer.text = text;
		this.composer.submission = { status: 'idle' };
	}

	cancel() {
		this.composer = null;
	}

	cancelTarget(target: DiscussionTarget): boolean {
		if (!this.composer || !discussionTargetsEqual(this.composer.target, target)) {
			return false;
		}
		this.composer = null;
		return true;
	}

	cancelReplyEdit(target: DiscussionTarget, replyId: string): boolean {
		const composer = this.composer;
		if (
			composer?.mode !== 'edit-reply' ||
			composer.replyId !== replyId ||
			!discussionTargetsEqual(composer.target, target)
		) {
			return false;
		}
		this.composer = null;
		return true;
	}

	isActive(target: DiscussionTarget): boolean {
		return Boolean(
			this.composer && discussionTargetsEqual(this.composer.target, target)
		);
	}

	beginSubmission(id: string): boolean {
		if (!this.composer || this.composer.id !== id) return false;
		if (this.composer.submission.status === 'pending') return false;
		this.composer.submission = { status: 'pending' };
		return true;
	}

	completeSubmission(id: string): boolean {
		if (this.composer?.id !== id) return false;
		this.composer = null;
		return true;
	}

	failSubmission(id: string, message: string): boolean {
		if (this.composer?.id !== id) return false;
		this.composer.submission = { status: 'error', message };
		return true;
	}

	async runRootDeletion(
		target: DiscussionTarget,
		operation: () => boolean | Promise<boolean>,
		failureMessage: string
	): Promise<boolean> {
		if (this.rootDeletion?.status === 'pending') return false;

		const operationId = createOperationId('discussion-root-deletion');
		this.#rootDeletionOperationId = operationId;
		this.rootDeletion = { status: 'pending', target };

		let deleted = false;
		try {
			deleted = await operation();
		} catch (error) {
			console.error('Discussion deletion failed.', error);
		}

		if (this.#rootDeletionOperationId !== operationId) return false;
		this.#rootDeletionOperationId = null;
		this.rootDeletion = deleted
			? null
			: { status: 'error', target, message: failureMessage };
		return deleted;
	}

	contentMutated(target: DiscussionTarget) {
		this.#clearRootDeletionError(target);
	}

	beginInteraction(target: DiscussionTarget) {
		this.#clearRootDeletionError(target);
	}

	isTargetBusy(target: DiscussionTarget): boolean {
		return Boolean(
			this.rootDeletion?.status === 'pending' &&
				discussionTargetsEqual(this.rootDeletion.target, target)
		);
	}

	#clearRootDeletionError(target: DiscussionTarget) {
		if (
			this.rootDeletion?.status === 'error' &&
			discussionTargetsEqual(this.rootDeletion.target, target)
		) {
			this.rootDeletion = null;
		}
	}
}

function createOperationId(prefix: string): string {
	return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${++fallbackOperationId}`;
}
