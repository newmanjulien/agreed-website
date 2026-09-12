import type { ClauseRegistry } from "../../document/agreement-model.ts";

export const agreementClauses = {
  "data-ownership": {
    title: "Data ownership",
    highlightTone: "informational",
    widget: {
      type: "faq",
      intro: "This is not a clause we are willing to change.",
      items: [
        {
          id: "ownership-example",
          question: "How does data ownership work?",
          answer: [
            {
              parts: [
                {
                  type: "text",
                  text: "You own your data outright.",
                },
              ],
            },
            {
              parts: [
                {
                  type: "text",
                  text: "As you use Agreed, you may provide information about the clauses in your agreements and how you prefer to negotiate them. That information remains yours and will be deleted if you leave Agreed.",
                },
              ],
            },
            {
              parts: [
                {
                  type: "text",
                  text: "You will also manage signatures and signed agreements through Agreed. Those materials are handled by our e-signature partner, BoldSign, rather than stored by Agreed, and are subject to BoldSign’s applicable terms and privacy practices.",
                },
              ],
            },
          ],
        },
        {
          id: "training-data",
          question: "Does this mean we own our training data?",
          answer: [
            {
              parts: [
                {
                  type: "text",
                  text: "We don't use your data to train anything.",
                },
              ],
            },
          ],
        },
      ],
    },
  },
  "research-introductions": {
    title: "Research introductions",
    highlightTone: "editable",
    values: {
      "introducer-titles": { defaultLabel: "CEO, COO, and CRO" },
    },
    widget: {
      type: "changes",
      prompt: "Choose which Street Talk roles will make introductions.",
      appliedMessage: "Your introduction commitment is updated.",
      control: {
        id: "introducer-titles",
        label: "Titles making introductions",
        defaultValue: "ceo-coo-cro",
        options: [
          {
            kind: "value",
            value: "ceo-coo-cro",
            controlLabel: "CEO, COO, and CRO",
            documentLabel: "CEO, COO, and CRO",
          },
          {
            kind: "value",
            value: "ceo-coo",
            controlLabel: "CEO and COO",
            documentLabel: "CEO and COO",
          },
          {
            kind: "value",
            value: "ceo-cro",
            controlLabel: "CEO and CRO",
            documentLabel: "CEO and CRO",
          },
          {
            kind: "value",
            value: "coo-cro",
            controlLabel: "COO and CRO",
            documentLabel: "COO and CRO",
          },
          {
            kind: "value",
            value: "ceo",
            controlLabel: "CEO",
            documentLabel: "CEO",
          },
          {
            kind: "value",
            value: "coo",
            controlLabel: "COO",
            documentLabel: "COO",
          },
          {
            kind: "value",
            value: "cro",
            controlLabel: "CRO",
            documentLabel: "CRO",
          },
          {
            kind: "deactivate",
            value: "none",
            controlLabel: "No roles",
            documentLabel: "none",
          },
          {
            kind: "custom",
            value: "other",
            controlLabel: "Other",
          },
        ],
      },
    },
  },
} as const satisfies ClauseRegistry;
