import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | undefined };

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "",
  });

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}

export const GPT4O = "gpt-4o";

export interface CompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** Call GPT-4o and return raw text. */
export async function complete(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<{ text: string; usage?: CompletionUsage }> {
  const res = await openai.chat.completions.create({
    model: GPT4O,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const content = res.choices[0]?.message?.content ?? "";
  const usage = res.usage
    ? {
        prompt_tokens: res.usage.prompt_tokens ?? 0,
        completion_tokens: res.usage.completion_tokens ?? 0,
        total_tokens: res.usage.total_tokens ?? 0,
      }
    : undefined;
  return { text: content, usage };
}

/** Call GPT-4o and parse response as JSON. */
export async function completeJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2048
): Promise<{ data: T; usage?: CompletionUsage }> {
  const system = [
    systemPrompt,
    "Respond with valid JSON only. No markdown, no code fences, no explanation.",
  ].join("\n\n");
  const { text, usage } = await complete(system, userPrompt, maxTokens);
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return { data: JSON.parse(cleaned) as T, usage };
  } catch {
    throw new Error(`OpenAI returned non-JSON: ${cleaned.slice(0, 200)}`);
  }
}
