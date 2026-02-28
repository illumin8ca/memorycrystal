import { query } from "../_generated/server";

const nowMs = () => Date.now();

const msPerDay = 24 * 60 * 60 * 1000;

export const getMemoryStats = query({
  args: {},
  handler: async (ctx) => {
    const sampleLimit = 500;
    const sample = await ctx.db
      .query("crystalMemories")
      .withIndex("by_last_accessed", (q) => q.gte("lastAccessedAt", 0))
      .take(sampleLimit + 1);

    const bounded = sample.length > sampleLimit;
    const memories = sample.slice(0, sampleLimit);
    const now = nowMs();

    const active = memories.filter((memory) => !memory.archived);
    const archivedCount = memories.length - active.length;

    const byStore = active.reduce<Record<string, number>>((acc, memory) => {
      acc[memory.store] = (acc[memory.store] ?? 0) + 1;
      return acc;
    }, {});

    const strengthSum = active.reduce((sum, memory) => sum + memory.strength, 0);
    const averageStrength = active.length > 0 ? strengthSum / active.length : 0;

    const last24h = now - msPerDay;
    const capturesLast24h = memories.filter((memory) => memory.createdAt >= last24h).length;

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
      totalMemories: memories.length,
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
