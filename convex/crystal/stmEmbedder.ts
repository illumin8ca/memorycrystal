import { v } from "convex/values";
import { action } from "../_generated/server";

const OPENAI_EMBEDDING_ENDPOINT = "https://api.openai.com/v1/embeddings";
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

const requestEmbedding = async (apiKey: string, content: string): Promise<number[] | null> => {
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
    throw new Error(`Embedding request failed: ${response.status}`);
  }

  const vector = payload.data?.[0]?.embedding;
  if (!Array.isArray(vector)) {
    return null;
  }

  return vector;
};

export const embedUnprocessedMessages = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    const apiKey = process.env.OPENAI_API_KEY;
    const stats = { processed: 0, succeeded: 0, failed: 0, skipped: 0 };

    const messages = await ctx.runQuery("crystal/messages:getUnembeddedMessages" as any, { limit });

    if (!apiKey) {
      return { ...stats, processed: messages.length, skipped: messages.length };
    }

    for (const message of messages) {
      stats.processed += 1;
      if (!message.content?.trim()) {
        stats.skipped += 1;
        continue;
      }

      try {
        const embedding = await requestEmbedding(apiKey, message.content);
        if (!embedding) {
          stats.skipped += 1;
          continue;
        }

        await ctx.runMutation("crystal/messages:updateMessageEmbedding" as any, {
          messageId: message._id,
          embedding,
        });
        stats.succeeded += 1;
      } catch (error) {
        stats.failed += 1;
      }
    }

    return stats;
  },
});

