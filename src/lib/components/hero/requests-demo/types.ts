export type DiscussionItem = {
  id: string;
  prompt: string;
  answer: string;
};

export type DiscussionGuide = {
  explanation: string;
  questions: ReadonlyArray<DiscussionItem>;
  context: ReadonlyArray<DiscussionItem>;
};

type RequestBase = {
  id: string;
  requestedChange: string;
};

export type AcceptRequest = RequestBase & { decision: 'canAccept'; points: number };
export type CannotAcceptRequest = RequestBase & {
  decision: 'cannotAccept';
  discussionGuide: DiscussionGuide;
};

export type ChangeRequest =
  | AcceptRequest
  | CannotAcceptRequest
  | (RequestBase & { decision: 'needsApproval' });
