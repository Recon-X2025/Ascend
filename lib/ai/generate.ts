import anthropic, { CLAUDE_MODEL } from "./client";

export async function generateText(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 2048
): Promise<string> {
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    ...(systemPrompt && { system: systemPrompt }),
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text")
    throw new Error("Unexpected response type from Claude");
  return content.text;
}

export async function generateJSON<T>(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 2048
): Promise<T> {
  const system = [
    systemPrompt || "",
    "You must respond with valid JSON only.",
    "No markdown, no code blocks, no explanation. Raw JSON only.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const text = await generateText(prompt, system, maxTokens);

  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim()) as T;
      } catch {
        throw new Error(
          `Failed to parse JSON from Claude response: ${text.slice(0, 300)}`
        );
      }
    }
    throw new Error(`Claude returned non-JSON response: ${text.slice(0, 300)}`);
  }
}

export async function generateStream(
  prompt: string,
  systemPrompt?: string,
  maxTokens = 2048,
  onChunk?: (text: string) => void
): Promise<string> {
  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    ...(systemPrompt && { system: systemPrompt }),
    messages: [{ role: "user", content: prompt }],
  });

  let fullText = "";

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullText += chunk.delta.text;
      onChunk?.(chunk.delta.text);
    }
  }

  return fullText;
}
