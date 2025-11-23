import { OpenRouterClient } from './openrouter';

/**
 * Evidence-Based FAQ / Myth Buster plan
 *
 * 1. Receive a topic string from the WhatsApp command handler.
 * 2. Build a deterministic prompt that enforces markdown sections:
 *    ## Evidence, ## Uncertainties, ## Practical Takeaways.
 * 3. Send the prompt + strict system message to OpenRouter for response.
 * 4. Return formatted markdown back to the chat for immediate delivery.
 *
 * The prompt template below is shared so other modules can reuse or extend it.
 */

export interface ScienceBriefPromptParams {
  topic: string;
}

export const SCIENCE_SYSTEM_PROMPT =
  'Summarize consensus of high-quality evidence (RCTs, meta-analyses). Avoid absolute claims. No magic hacks.';

const SCIENCE_PROMPT_TEMPLATE = `
You are preparing a short science brief about **{{TOPIC}}**.

Requirements:
- Cite only high-quality evidence (RCTs, meta-analyses, umbrella reviews).
- Use neutral language, highlight consensus first, then unknowns.
- Output must use markdown with EXACTLY these sections and bullet counts.

Format:
## Evidence
- 2-3 concise bullets that summarize what studies show.

## Uncertainties
- 1-2 bullets on what remains unclear, conflicting, or under-studied.

## Practical Takeaways
- 3 numbered bullets with pragmatic guidance grounded in the evidence.
`;

export const buildScienceBriefPrompt = ({ topic }: ScienceBriefPromptParams): string => {
  const trimmedTopic = topic.trim();
  if (!trimmedTopic) {
    throw new Error('Topic is required to build a science brief prompt.');
  }

  return SCIENCE_PROMPT_TEMPLATE.replace('{{TOPIC}}', trimmedTopic);
};

export interface GenerateScienceBriefParams {
  topic: string;
}

export interface ScienceBriefDependencies {
  openRouterClient: OpenRouterClient;
}

export type GenerateScienceBriefInput = GenerateScienceBriefParams & ScienceBriefDependencies;

export const generateScienceBrief = async ({
  topic,
  openRouterClient,
}: GenerateScienceBriefInput): Promise<string> => {
  const sanitizedTopic = topic.trim();
  if (!sanitizedTopic) {
    throw new Error('Topic is required for science brief generation.');
  }

  if (!openRouterClient.isEnabled()) {
    throw new Error('OpenRouter client is disabled.');
  }

  const prompt = buildScienceBriefPrompt({ topic: sanitizedTopic });
  return openRouterClient.generateText(prompt, SCIENCE_SYSTEM_PROMPT);
};

