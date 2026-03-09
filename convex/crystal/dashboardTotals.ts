import { v } from "convex/values";
import { internalMutation, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";

export const memoryStoreValues = ["sensory", "episodic", "semantic", "procedural", "prospective"] as const;
export type MemoryStore = (typeof memoryStoreValues)[number];

export type DashboardTotalsByStore = {
  sensory: number;
  episodic: number;
  semantic: number;
  procedural: number;
  prospective: number;
};

export type DashboardTotalsSnapshot = {
  _id?: string;
  userId: string;
  totalMemories: number;
  activeMemories: number;
  archivedMemories: number;
  totalMessages: number;
  activeMemoriesByStore: DashboardTotalsByStore;
  activeStoreCount: number;
  lastCaptureMemoryId?: string;
  lastCaptureStore?: MemoryStore;
  lastCaptureTitle?: string;
  lastCaptureCreatedAt?: number;
  updatedAt: number;
};

type DashboardTotalsDelta = {
  totalMemoriesDelta?: number;
  activeMemoriesDelta?: number;
  archivedMemoriesDelta?: number;
  totalMessagesDelta?: number;
  activeMemoriesByStoreDelta?: Partial<Record<MemoryStore, number>>;
  lastCaptureMemoryId?: string;
  lastCaptureStore?: MemoryStore;
  lastCaptureTitle?: string;
  lastCaptureCreatedAt?: number;
};

const ZERO_COUNTS: DashboardTotalsByStore = {
  sensory: 0,
  episodic: 0,
  semantic: 0,
  procedural: 0,
  prospective: 0,
};


function clampCount(value: unknown): number {
  const numericValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(numericValue)) return 0;
  return Math.max(0, Math.floor(numericValue));
}

function normalizeStore(store: string): MemoryStore | undefined {
  if (memoryStoreValues.includes(store as MemoryStore)) {
    return store as MemoryStore;
  }
  return undefined;
}

function normalizeByStore(value: unknown): DashboardTotalsByStore {
  const input = (value ?? {}) as Partial<Record<string, number>>;
  return {
    sensory: clampCount(input.sensory ?? 0),
    episodic: clampCount(input.episodic ?? 0),
    semantic: clampCount(input.semantic ?? 0),
    procedural: clampCount(input.procedural ?? 0),
    prospective: clampCount(input.prospective ?? 0),
  };
}

function normalizeTotals(value: any): DashboardTotalsSnapshot {
  const activeMemoriesByStore = normalizeByStore(value?.activeMemoriesByStore);
  const activeStoreCount = Number(
    Object.values(activeMemoriesByStore).filter((count) => count > 0).length
  );

  const totalMemories = clampCount(value?.totalMemories);
  const activeMemories = clampCount(value?.activeMemories);
  const archivedMemories = clampCount(value?.archivedMemories);
  const totalMessages = clampCount(value?.totalMessages);

  return {
    _id: value?._id,
    userId: value?.userId ?? "",
    totalMemories,
    activeMemories,
    archivedMemories,
    totalMessages,
    activeMemoriesByStore,
    activeStoreCount,
    lastCaptureMemoryId: value?.lastCaptureMemoryId,
    lastCaptureStore: normalizeStore(value?.lastCaptureStore) ?? undefined,
    lastCaptureTitle: value?.lastCaptureTitle,
    lastCaptureCreatedAt: value?.lastCaptureCreatedAt,
    updatedAt: clampCount(value?.updatedAt),
  };
}

function requireDashboardTotalsWebhookToken(webhookToken: string) {
  if (!process.env.POLAR_WEBHOOK_SECRET || webhookToken !== process.env.POLAR_WEBHOOK_SECRET) {
    throw new Error("Unauthorized");
  }
}

function newEmptyTotals(userId: string): DashboardTotalsSnapshot {
  return {
    userId,
    totalMemories: 0,
    activeMemories: 0,
    archivedMemories: 0,
    totalMessages: 0,
    activeMemoriesByStore: { ...ZERO_COUNTS },
    activeStoreCount: 0,
    updatedAt: Date.now(),
  };
}

function applyDelta(current: DashboardTotalsSnapshot, delta: DashboardTotalsDelta): DashboardTotalsSnapshot {
  const next: DashboardTotalsSnapshot = {
    ...current,
    totalMemories: clampCount(current.totalMemories + (delta.totalMemoriesDelta ?? 0)),
    activeMemories: clampCount(current.activeMemories + (delta.activeMemoriesDelta ?? 0)),
    archivedMemories: clampCount(current.archivedMemories + (delta.archivedMemoriesDelta ?? 0)),
    totalMessages: clampCount(current.totalMessages + (delta.totalMessagesDelta ?? 0)),
    activeMemoriesByStore: { ...current.activeMemoriesByStore },
    updatedAt: Date.now(),
  };

  const byStoreDelta = delta.activeMemoriesByStoreDelta ?? {};
  for (const store of memoryStoreValues) {
    const existing = current.activeMemoriesByStore[store];
    const adjustment = byStoreDelta[store] ?? 0;
    next.activeMemoriesByStore[store] = clampCount(existing + adjustment);
  }

  if (delta.lastCaptureCreatedAt !== undefined) {
    const previousCreatedAt = current.lastCaptureCreatedAt ?? Number.NEGATIVE_INFINITY;
    if (delta.lastCaptureCreatedAt >= previousCreatedAt) {
      next.lastCaptureCreatedAt = delta.lastCaptureCreatedAt;
      next.lastCaptureStore = delta.lastCaptureStore;
      next.lastCaptureTitle = delta.lastCaptureTitle;
      next.lastCaptureMemoryId = delta.lastCaptureMemoryId;
    }
  }

  next.activeStoreCount = Object.values(next.activeMemoriesByStore).filter((count) => count > 0).length;

  return next;
}

function normalizeStorePayload(payload: DashboardTotalsSnapshot): Omit<DashboardTotalsSnapshot, "_id"> {
  return {
    userId: payload.userId,
    totalMemories: clampCount(payload.totalMemories),
    activeMemories: clampCount(payload.activeMemories),
    archivedMemories: clampCount(payload.archivedMemories),
    totalMessages: clampCount(payload.totalMessages),
    activeMemoriesByStore: {
      ...ZERO_COUNTS,
      ...payload.activeMemoriesByStore,
    },
    activeStoreCount: clampCount(payload.activeStoreCount),
    lastCaptureMemoryId: payload.lastCaptureMemoryId,
    lastCaptureStore: payload.lastCaptureStore,
    lastCaptureTitle: payload.lastCaptureTitle,
    lastCaptureCreatedAt: payload.lastCaptureCreatedAt,
    updatedAt: Date.now(),
  };
}

async function getStoredTotals(ctx: any, userId: string): Promise<DashboardTotalsSnapshot | null> {
  const rows = await ctx.db
    .query("crystalDashboardTotals")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  if (rows.length === 0) return null;

  const sorted = rows.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return normalizeTotals(sorted[0]);
}

async function writeTotals(ctx: any, userId: string, snapshot: DashboardTotalsSnapshot): Promise<void> {
  const current = await getStoredTotals(ctx, userId);
  const normalized = normalizeStorePayload(snapshot);

  if (current?._id) {
    await ctx.db.patch(current._id, normalized);
    return;
  }

  await ctx.db.insert("crystalDashboardTotals", normalized);
}

export async function applyDashboardTotalsDelta(ctx: any, userId: string, delta: DashboardTotalsDelta): Promise<void> {
  const current = (await getStoredTotals(ctx, userId)) ?? newEmptyTotals(userId);
  const next = applyDelta(current, delta);
  const normalized = normalizeStorePayload(next);
  await writeTotals(ctx, userId, normalized as DashboardTotalsSnapshot);
}

export function buildMemoryCreateDelta(args: {
  store: string;
  archived: boolean;
  title: string;
  memoryId: string;
  createdAt: number;
}): DashboardTotalsDelta {
  const store = normalizeStore(args.store);
  const byStoreDelta: Partial<Record<MemoryStore, number>> = {};
  if (store && !args.archived) {
    byStoreDelta[store] = 1;
  }

  return {
    totalMemoriesDelta: 1,
    activeMemoriesDelta: args.archived ? 0 : 1,
    archivedMemoriesDelta: args.archived ? 1 : 0,
    activeMemoriesByStoreDelta: byStoreDelta,
    lastCaptureMemoryId: args.memoryId,
    lastCaptureStore: store,
    lastCaptureTitle: args.title,
    lastCaptureCreatedAt: args.createdAt,
  };
}

export function buildMemoryTransitionDelta(args: {
  oldArchived: boolean;
  oldStore: string;
  newArchived: boolean;
  newStore: string;
}): DashboardTotalsDelta {
  const oldStore = normalizeStore(args.oldStore);
  const newStore = normalizeStore(args.newStore);
  const byStoreDelta: Partial<Record<MemoryStore, number>> = {};

  if (!args.oldArchived && !args.newArchived && oldStore && newStore && oldStore !== newStore) {
    byStoreDelta[oldStore] = (byStoreDelta[oldStore] ?? 0) - 1;
    byStoreDelta[newStore] = (byStoreDelta[newStore] ?? 0) + 1;
  } else if (args.oldArchived && !args.newArchived) {
    if (newStore) {
      byStoreDelta[newStore] = (byStoreDelta[newStore] ?? 0) + 1;
    }
  } else if (!args.oldArchived && args.newArchived) {
    if (oldStore) {
      byStoreDelta[oldStore] = (byStoreDelta[oldStore] ?? 0) - 1;
    }
  }

  return {
    activeMemoriesDelta: !args.oldArchived && args.newArchived ? -1 : args.oldArchived && !args.newArchived ? 1 : 0,
    archivedMemoriesDelta:
      args.oldArchived && !args.newArchived ? -1 : !args.oldArchived && args.newArchived ? 1 : 0,
    totalMemoriesDelta: 0,
    activeMemoriesByStoreDelta: byStoreDelta,
  };
}

export async function getDashboardTotals(ctx: any, userId: string): Promise<DashboardTotalsSnapshot> {
  let stored: DashboardTotalsSnapshot | null = null;
  try {
    stored = await getStoredTotals(ctx, userId);
  } catch (_error) {
    // If the aggregate table is unavailable (e.g., before backfill or during rollout),
    // compute the totals from source data directly to keep dashboard queries available.
    stored = null;
  }

  if (stored) return stored;

  return await computeDashboardTotalsFromSource(ctx, userId);
}

export async function computeDashboardTotalsFromSource(ctx: any, userId: string): Promise<DashboardTotalsSnapshot> {
  const totals: DashboardTotalsSnapshot = newEmptyTotals(userId);
  let cursor: string | null = null;

  while (true) {
    const page = await ctx.db
      .query("crystalMemories")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .paginate({
        numItems: 400,
        cursor,
        maximumBytesRead: 4_000_000,
      });

    for (const memory of (page as any).page as Array<any>) {
      totals.totalMemories += 1;
      if (memory.archived) {
        totals.archivedMemories += 1;
        continue;
      }

      totals.activeMemories += 1;
      if (memory.store in totals.activeMemoriesByStore) {
        totals.activeMemoriesByStore[memory.store as MemoryStore] = clampCount(
          (totals.activeMemoriesByStore[memory.store as MemoryStore] || 0) + 1,
        );
      }

      if (
        memory.createdAt !== undefined &&
        (totals.lastCaptureCreatedAt === undefined || memory.createdAt > (totals.lastCaptureCreatedAt ?? Number.NEGATIVE_INFINITY))
      ) {
        totals.lastCaptureMemoryId = memory._id;
        totals.lastCaptureStore = normalizeStore(memory.store);
        totals.lastCaptureTitle = memory.title;
        totals.lastCaptureCreatedAt = memory.createdAt;
      }
    }

    if (page.isDone) {
      break;
    }

    const nextCursor = (page as any).continueCursor ?? null;
    if (!nextCursor) {
      break;
    }

    cursor = nextCursor;
  }

  let messageCursor: string | null = null;
  while (true) {
    const page = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q: any) => q.eq("userId", userId))
      .paginate({
        numItems: 400,
        cursor: messageCursor,
        maximumBytesRead: 4_000_000,
      });

    totals.totalMessages += (page.page ?? []).length;

    if (page.isDone) {
      break;
    }

    const nextCursor = (page as any).continueCursor ?? null;
    if (!nextCursor) {
      break;
    }

    messageCursor = nextCursor;
  }

  totals.activeStoreCount = Object.values(totals.activeMemoriesByStore).filter((count) => count > 0).length;
  totals.updatedAt = Date.now();

  return normalizeStorePayload(totals) as DashboardTotalsSnapshot;
}

const BACKFILL_PAGE_SIZE = 150;
const BACKFILL_MAX_BYTES = 4_000_000;

function hydrateTotalsFromMemory(totals: DashboardTotalsSnapshot, memory: any): void {
  totals.totalMemories += 1;

  if (memory.archived) {
    totals.archivedMemories += 1;
    return;
  }

  totals.activeMemories += 1;
  if (memory.store in totals.activeMemoriesByStore) {
    totals.activeMemoriesByStore[memory.store as MemoryStore] = clampCount(
      (totals.activeMemoriesByStore[memory.store as MemoryStore] || 0) + 1,
    );
  }

  if (
    memory.createdAt !== undefined &&
    (totals.lastCaptureCreatedAt === undefined || memory.createdAt > (totals.lastCaptureCreatedAt ?? Number.NEGATIVE_INFINITY))
  ) {
    totals.lastCaptureCreatedAt = memory.createdAt;
    totals.lastCaptureMemoryId = memory._id;
    totals.lastCaptureStore = normalizeStore(memory.store);
    totals.lastCaptureTitle = memory.title;
  }
}

function getBackfillAccumulator(args: any, userId: string): DashboardTotalsSnapshot {
  return {
    userId,
    totalMemories: clampCount(args.totalMemories ?? 0),
    activeMemories: clampCount(args.activeMemories ?? 0),
    archivedMemories: clampCount(args.archivedMemories ?? 0),
    totalMessages: clampCount(args.totalMessages ?? 0),
    activeMemoriesByStore: {
      sensory: clampCount(args.activeSensory ?? 0),
      episodic: clampCount(args.activeEpisodic ?? 0),
      semantic: clampCount(args.activeSemantic ?? 0),
      procedural: clampCount(args.activeProcedural ?? 0),
      prospective: clampCount(args.activeProspective ?? 0),
    },
    activeStoreCount: 0,
    lastCaptureMemoryId: args.lastCaptureMemoryId,
    lastCaptureStore: normalizeStore(args.lastCaptureStore ?? ""),
    lastCaptureTitle: args.lastCaptureTitle,
    lastCaptureCreatedAt: args.lastCaptureCreatedAt,
    updatedAt: Date.now(),
  };
}

export const adminRepairBackfillDashboardTotalsForUser = internalMutation({
  args: {
    userId: v.string(),
    stage: v.union(v.literal("memories"), v.literal("messages")),
    memoryCursor: v.optional(v.string()),
    messageCursor: v.optional(v.string()),
    pageSize: v.optional(v.number()),
    totalMemories: v.optional(v.number()),
    activeMemories: v.optional(v.number()),
    archivedMemories: v.optional(v.number()),
    totalMessages: v.optional(v.number()),
    activeSensory: v.optional(v.number()),
    activeEpisodic: v.optional(v.number()),
    activeSemantic: v.optional(v.number()),
    activeProcedural: v.optional(v.number()),
    activeProspective: v.optional(v.number()),
    lastCaptureMemoryId: v.optional(v.id("crystalMemories")),
    lastCaptureStore: v.optional(
      v.union(
        v.literal("sensory"),
        v.literal("episodic"),
        v.literal("semantic"),
        v.literal("procedural"),
        v.literal("prospective"),
      ),
    ),
    lastCaptureTitle: v.optional(v.string()),
    lastCaptureCreatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const pageSize = clampCount(args.pageSize ?? BACKFILL_PAGE_SIZE) || BACKFILL_PAGE_SIZE;
    const totals = getBackfillAccumulator(args, args.userId);

    if (args.stage === "memories") {
      const page = await ctx.db
        .query("crystalMemories")
        .withIndex("by_user", (q: any) => q.eq("userId", args.userId))
        .order("desc")
        .paginate({
          numItems: pageSize,
          cursor: args.memoryCursor,
          maximumBytesRead: BACKFILL_MAX_BYTES,
        });

      for (const memory of (page as any).page as Array<any>) {
        hydrateTotalsFromMemory(totals, memory);
      }

      if (!page.isDone) {
        const continueCursor = (page as any).continueCursor as string | undefined;
        if (continueCursor) {
          await ctx.scheduler.runAfter(0, internal.crystal.dashboardTotals.adminRepairBackfillDashboardTotalsForUser, {
            userId: args.userId,
            stage: "memories",
            memoryCursor: continueCursor,
            pageSize,
            totalMemories: totals.totalMemories,
            activeMemories: totals.activeMemories,
            archivedMemories: totals.archivedMemories,
            totalMessages: totals.totalMessages,
            activeSensory: totals.activeMemoriesByStore.sensory,
            activeEpisodic: totals.activeMemoriesByStore.episodic,
            activeSemantic: totals.activeMemoriesByStore.semantic,
            activeProcedural: totals.activeMemoriesByStore.procedural,
            activeProspective: totals.activeMemoriesByStore.prospective,
            lastCaptureMemoryId: totals.lastCaptureMemoryId as string | undefined,
            lastCaptureStore: totals.lastCaptureStore,
            lastCaptureTitle: totals.lastCaptureTitle,
            lastCaptureCreatedAt: totals.lastCaptureCreatedAt,
          });
          return { ok: true, userId: args.userId, stage: "memories", status: "running" };
        }
      }

      await ctx.scheduler.runAfter(0, internal.crystal.dashboardTotals.adminRepairBackfillDashboardTotalsForUser, {
        userId: args.userId,
        stage: "messages",
        pageSize,
        totalMemories: totals.totalMemories,
        activeMemories: totals.activeMemories,
        archivedMemories: totals.archivedMemories,
        totalMessages: totals.totalMessages,
        activeSensory: totals.activeMemoriesByStore.sensory,
        activeEpisodic: totals.activeMemoriesByStore.episodic,
        activeSemantic: totals.activeMemoriesByStore.semantic,
        activeProcedural: totals.activeMemoriesByStore.procedural,
        activeProspective: totals.activeMemoriesByStore.prospective,
        lastCaptureMemoryId: totals.lastCaptureMemoryId as string | undefined,
        lastCaptureStore: totals.lastCaptureStore,
        lastCaptureTitle: totals.lastCaptureTitle,
        lastCaptureCreatedAt: totals.lastCaptureCreatedAt,
      });
      return { ok: true, userId: args.userId, stage: "messages", status: "running" };
    }

    const messagePage = await ctx.db
      .query("crystalMessages")
      .withIndex("by_user_time", (q: any) => q.eq("userId", args.userId))
      .order("desc")
      .paginate({
        numItems: pageSize,
        cursor: args.messageCursor,
        maximumBytesRead: BACKFILL_MAX_BYTES,
      });

    totals.totalMessages += ((messagePage as any).page?.length ?? 0);

    if (!messagePage.isDone) {
      const continueCursor = (messagePage as any).continueCursor as string | undefined;
      if (continueCursor) {
        await ctx.scheduler.runAfter(0, internal.crystal.dashboardTotals.adminRepairBackfillDashboardTotalsForUser, {
          userId: args.userId,
          stage: "messages",
          pageSize,
          messageCursor: continueCursor,
          totalMemories: totals.totalMemories,
          activeMemories: totals.activeMemories,
          archivedMemories: totals.archivedMemories,
          totalMessages: totals.totalMessages,
          activeSensory: totals.activeMemoriesByStore.sensory,
          activeEpisodic: totals.activeMemoriesByStore.episodic,
          activeSemantic: totals.activeMemoriesByStore.semantic,
          activeProcedural: totals.activeMemoriesByStore.procedural,
          activeProspective: totals.activeMemoriesByStore.prospective,
          lastCaptureMemoryId: totals.lastCaptureMemoryId as string | undefined,
          lastCaptureStore: totals.lastCaptureStore,
          lastCaptureTitle: totals.lastCaptureTitle,
          lastCaptureCreatedAt: totals.lastCaptureCreatedAt,
        });
        return { ok: true, userId: args.userId, stage: "messages", status: "running" };
      }
    }

    totals.activeStoreCount = Object.values(totals.activeMemoriesByStore).filter((count) => count > 0).length;
    await writeTotals(ctx, args.userId, totals);

    return {
      ok: true,
      userId: args.userId,
      stage: "messages",
      status: "complete",
      totalMemories: totals.totalMemories,
      activeMemories: totals.activeMemories,
      archivedMemories: totals.archivedMemories,
      totalMessages: totals.totalMessages,
      activeStoreCount: totals.activeStoreCount,
    };
  },
});

export const backfillDashboardTotalsForUser = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const rebuilt = await computeDashboardTotalsFromSource(ctx, userId);
    await writeTotals(ctx, userId, rebuilt);
    return rebuilt;
  },
});

export const backfillAllDashboardTotals = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user")
      .collect();

    const seen = new Set<string>();
    let count = 0;
    for (const profile of users) {
      if (!profile.userId || seen.has(profile.userId)) {
        continue;
      }
      seen.add(profile.userId);
      await ctx.scheduler.runAfter(0, internal.crystal.dashboardTotals.adminRepairBackfillDashboardTotalsForUser, {
        userId: profile.userId,
        stage: "memories",
      });
      count += 1;
    }
    return { usersProcessed: count };
  },
});

export const adminRepairBackfillAllDashboardTotals = mutation({
  args: { webhookToken: v.string() },
  handler: async (ctx, { webhookToken }) => {
    requireDashboardTotalsWebhookToken(webhookToken);

    const users = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user")
      .collect();

    const seen = new Set<string>();
    let count = 0;
    for (const profile of users) {
      if (!profile.userId || seen.has(profile.userId)) {
        continue;
      }

      seen.add(profile.userId);
      await ctx.scheduler.runAfter(0, internal.crystal.dashboardTotals.adminRepairBackfillDashboardTotalsForUser, {
        userId: profile.userId,
        stage: "memories",
      });
      count += 1;
    }

    return {
      ok: true,
      usersScheduled: count,
      note: "Backfill workers are running in the background; call this function again to confirm completion.",
    };
  },
});

export const adminListBackfillUsers = query({
  args: { webhookToken: v.string() },
  handler: async (ctx, { webhookToken }) => {
    requireDashboardTotalsWebhookToken(webhookToken);

    const users = await ctx.db
      .query("crystalUserProfiles")
      .withIndex("by_user")
      .collect();

    const seen = new Set<string>();
    for (const profile of users) {
      if (!profile.userId) continue;
      seen.add(profile.userId);
    }

    return Array.from(seen).sort();
  },
});

export const adminGetDashboardTotalsForUser = query({
  args: {
    webhookToken: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { webhookToken, userId }) => {
    requireDashboardTotalsWebhookToken(webhookToken);

    const rows = await ctx.db
      .query("crystalDashboardTotals")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .collect();

    if (rows.length === 0) {
      return null;
    }

    const sorted = rows.sort((a: any, b: any) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    return normalizeTotals(sorted[0]);
  },
});

export const adminListDashboardTotals = query({
  args: { webhookToken: v.string() },
  handler: async (ctx, { webhookToken }) => {
    requireDashboardTotalsWebhookToken(webhookToken);

    const userIds = await ctx.runQuery(internal.crystal.dashboardTotals.adminListBackfillUsers, { webhookToken });

    const rows = await Promise.all(
      userIds.map(async (userId: string) => {
        const totals = await getStoredTotals(ctx, userId);
        return {
          userId,
          hasTotals: !!totals,
          totalMemories: totals?.totalMemories ?? 0,
          activeMemories: totals?.activeMemories ?? 0,
          archivedMemories: totals?.archivedMemories ?? 0,
          totalMessages: totals?.totalMessages ?? 0,
          activeStoreCount: totals?.activeStoreCount ?? 0,
          lastCaptureCreatedAt: totals?.lastCaptureCreatedAt,
        };
      }),
    );

    return rows;
  },
});
