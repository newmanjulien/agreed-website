import type { ChangeRequest } from './types';

export const mockRequests: ChangeRequest[] = [
  {
    id: "notice-period",
    requestedChange:
      "Add a 10-day notice period before suspending service for non-payment",
    decision: "canAccept",
    points: 3,
  },
  {
    id: "liability-cap",
    requestedChange:
      "Increase the liability cap from 1x to 2x fees paid under the MSA",
    decision: "needsApproval",
  },
  {
    id: "unlimited-liability",
    requestedChange: "Require unlimited liability for all breaches of the MSA",
    decision: "cannotAccept",
    discussionGuide: {
      explanation:
        "We can't agree to unlimited liability for every breach of the MSA. Find out which risks the buyer wants covered so a specific concern can be reviewed.",
      questions: [
        {
          id: "concern",
          prompt: "Which obligations are you most concerned about?",
          answer:
            "Ask for an example of what could go wrong with that obligation. This helps narrow the discussion to a specific risk instead of removing the cap for every breach.",
        },
        {
          id: "impact",
          prompt: "What loss would you need protected if that happened?",
          answer:
            "Find out where the buyer thinks the current cap may fall short. Ask how the potential loss compares with the current limit.",
        },
        {
          id: "specific-request",
          prompt: "Is there a specific claim you want us to consider separately?",
          answer:
            "Ask which claim or scenario the buyer wants considered, including any wording they have in mind. This gives legal something specific to review without promising an exception.",
        },
      ],
      context: [
        {
          id: "why-not",
          prompt: "Why can't you agree to unlimited liability?",
          answer:
            "That would remove the limit for every breach, including routine disputes. We can't accept that broad change, but I'd like to understand the specific risks you're trying to address.",
        },
        {
          id: "losses",
          prompt: "What if the cap doesn't cover our losses?",
          answer:
            "I understand the concern. Can you walk me through the scenario and the loss you anticipate? I can take that specific issue back for review.",
        },
        {
          id: "carve-out",
          prompt: "Can you make an exception for a particular breach?",
          answer:
            "We can review a specific exception, but I can't commit to one in this conversation. Any proposed exception would need legal approval first.",
        },
      ],
    },
  },
  {
    id: "cure-period",
    requestedChange:
      "Add a 30-day cure period before termination for material breach",
    decision: "canAccept",
    points: 1,
  },
  {
    id: "termination-convenience",
    requestedChange:
      "Add a termination for convenience right with 30 days' notice",
    decision: "needsApproval",
  },
];

export function mockRequest(id: string): ChangeRequest {
  const request = mockRequests.find((item) => item.id === id);
  if (!request) throw new Error(`Unknown mock request "${id}".`);
  return request;
}
