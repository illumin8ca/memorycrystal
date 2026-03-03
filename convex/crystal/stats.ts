import { stableUserId } from "./auth";
import { query } from "../_generated/server";

const nowMs = () => Date.now();
const msPerDay = 24 * 60 * 60 * 1000;

export const getMemoryStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const userId = stableUserId(identity.subject);

    const sampleLimit = 500;
    const sample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", false))
      .take(sampleLimit + 1);

    const bounded = sample.length > sampleLimit;
    const active = sample.slice(0, sampleLimit);
    const now = nowMs();

    // Also count archived
    const archivedSample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q) => q.eq("userId", userId).eq("archived", true))
      .take(sampleLimit);

    const archivedCount = archivedSample.length;

    const byStore = active.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.store] = (acc[memory.store] ?? 0) + 1;
      return acc;
    }, {});

    const strengthSum = active.reduce((sum, memory) => sum + memory.strength, 0);
    const averageStrength = active.length > 0 ? strengthSum / active.length : 0;

    const last24h = now - msPerDay;
    const capturesLast24h = active.filter((memory) => memory.createdAt >= last24h).length;

    const strongest = active
      .slice()
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map((memory) => ({
        memoryId: memory._id,
        title: memory.title,
        store: memory.store,
        strength: memory.strength,
        confidence: memory.confidence,
      }));

    return {
      totalMemories: active.length + archivedCount,
      archivedCount,
      byStore,
      avgStrength: averageStrength,
      recentCaptures: capturesLast24h,
      activeMemories: active.length,
      strongest,
      statsNote: bounded ? `Stats are approximate; capped at ${sampleLimit} memories.` : undefined,
    };
  },
});
