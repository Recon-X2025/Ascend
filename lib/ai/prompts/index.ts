export interface PromptTemplate {
  version: string;
  feature: string;
  description: string;
  build: (input: Record<string, unknown>) => string;
}

export const PROMPT_REGISTRY: Record<string, PromptTemplate> = {};

export function registerPrompt(prompt: PromptTemplate): void {
  PROMPT_REGISTRY[prompt.version] = prompt;
}

export function getPrompt(version: string): PromptTemplate {
  const prompt = PROMPT_REGISTRY[version];
  if (!prompt) throw new Error(`Prompt version not found: ${version}`);
  return prompt;
}

// Side-effect imports so all prompts register on first use of this module
import "./resume";
import "./fit-score";
import "./optimiser";
import "./interview";
import "./career";
