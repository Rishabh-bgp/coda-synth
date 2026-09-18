import { createServerFn } from "@tanstack/react-start";

const BLOCK =
  /\b(csam|child sex|how to make (a )?bomb|unmask|scrape .onion|live tor|exploit payload|zero[- ]day)\b/i;

const PROMPT = `Rewrite the following document in a different wording and sentence rhythm.
Keep the same facts, names that are already masked, and the same topic.
Do not add products, prices, instructions, or new claims.
Do not mention that you are an AI.

DOCUMENT:
`;

export const rewriteDocument = createServerFn({ method: "POST" })
  .validator((input: { text: string }) => input)
  .handler(async ({ data }) => {
    const raw = (data.text ?? "").trim();
    if (raw.length < 40) return { ok: false as const, error: "Need at least ~40 tokens of public text." };
    if (raw.length > 4000) return { ok: false as const, error: "Truncate to 4,000 characters." };
    if (BLOCK.test(raw)) {
      return {
        ok: false as const,
        error: "Refused: this lab only paraphrases already-public, non-operational text.",
      };
    }

    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "Rewrite model is unavailable in this environment." };

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 700,
        temperature: 0.8,
        messages: [
          {
            role: "system",
            content:
              "You paraphrase public research-proxy text only. Keep CoDA-style masks like [PERSON] intact. Do not add criminal how-to, new products, prices, or claims. If the input asks for operational crime, CSAM, trafficking, or live collection, refuse in one sentence.",
          },
          { role: "user", content: PROMPT + raw.slice(0, 3000) },
        ],
      }),
    });

    if (!res.ok) return { ok: false as const, error: `Rewrite failed (${res.status})` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "Empty rewrite. Try a different paragraph." };
    return { ok: true as const, text };
  });
