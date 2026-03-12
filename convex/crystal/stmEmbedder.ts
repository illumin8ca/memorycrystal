import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const OPENAI_EMBEDDING_ENDPOINT = "https://api.openai.com/v1/embeddings";
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const GEMINI_EMBEDDING_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_EMBEDDING_MODEL = "gemini-embedding-2-preview";

type EmbeddingProvider = "openai" | "gemini";

const getProvider = (): EmbeddingProvider => {
  const provider = (process.env.EMBEDDING_PROVIDER ?? "openai").toLowerCase();
  return provider === "gemini" ? "gemini" : "openai";
};

const requestOpenAIEmbedding = async (apiKey: string, content: string): Promise<number[] | null> => {
  const response = await fetch(OPENAI_EMBEDDING_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: content,
      encoding_format: "float",
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw new Error(`OpenAI embedding request failed: ${response.status}`);
  }

  const vector = payload.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    return null;
  }

  return vector;
};

const requestGeminiEmbedding = async (apiKey: string, content: string): Promise<number[] | null> => {
  const model = process.env.GEMINI_EMBEDDING_MODEL || GEMINI_EMBEDDING_MODEL;
  const response = await fetch(
    `${GEMINI_EMBEDDING_ENDPOINT}/models/${model}:embedContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: {
          parts: [{ text: content }],
        },
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    throw new Error(`Gemini embedding request failed: ${response.status}`);
  }

  const vector = payload.embedding?.values;
  if (!Array.isArray(vector)) {
    return null;
  }

  return vector;
};

const requestEmbedding = async (content: string): Promise<number[] | null> => {
  const provider = getProvider();

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required when EMBEDDING_PROVIDER=gemini");
    }
    return requestGeminiEmbedding(apiKey, content);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai");
  }
  return requestOpenAIEmbedding(apiKey, content);
};

export const embedUnprocessedMessages = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ processed: number; succeeded: number; failed: number; skipped: number }> => {
    const limit = Math.min(args.limit ?? 50, 100);
    const provider = getProvider();
    const stats = { processed: 0, succeeded: 0, failed: 0, skipped: 0 };

    const messages = await ctx.runQuery(internal.crystal.messages.getUnembeddedMessages, { limit });

    if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
      return { ...stats, processed: messages.length, skipped: messages.length };
    }

    if (provider === "openai" && !process.env.OPENAI_API_KEY) {
      return { ...stats, processed: messages.length, skipped: messages.length };
    }

    for (const message of messages) {
      stats.processed += 1;
      if (!message.content?.trim()) {
        stats.skipped += 1;
        continue;
      }

      try {
        const embedding = await requestEmbedding(message.content);
        if (!embedding) {
          stats.skipped += 1;
          continue;
        }

        await ctx.runMutation(internal.crystal.messages.updateMessageEmbedding, {
          messageId: message._id,
          embedding,
        });
        stats.succeeded += 1;
      } catch {
        stats.failed += 1;
      }
    }

    return stats;
  },
});
