import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

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

const BASE_QUERY_PAGE_SIZE = 200;
const MAX_BYTES_PER_PAGE = 4_000_000;

function clampCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
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
  const stored = await getStoredTotals(ctx, userId);
  if (stored) return stored;

  const rebuilt = await computeDashboardTotalsFromSource(ctx, userId);
  return rebuilt;
}

export async function computeDashboardTotalsFromSource(ctx: any, userId: string): Promise<DashboardTotalsSnapshot> {
  const totals = newEmptyTotals(userId);

  const scanMemoryState = async (archived: boolean) => {
    let cursor: string | null = null;
    while (true) {
      const page = (await ctx.db
        .query("crystalMemories")
        .withIndex("by_user", (q: any) => q.eq("userId", userId).eq("archived", archived))
        .order("desc")
        .paginate({
          numItems: BASE_QUERY_PAGE_SIZE,
          cursor,
          maximumBytesRead: MAX_BYTES_PER_PAGE,
        })) as any;

      for (const memory of page.page) {
        totals.totalMemories += 1;

        if (archived) {
          totals.archivedMemories += 1;
          continue;
        }

        totals.activeMemories += 1;
        const store = normalizeStore(memory.store);
        if (store) {
          totals.activeMemoriesByStore[store] = clampCount(totals.activeMemoriesByStore[store] + 1);
        }

        if (
          totals.lastCaptureCreatedAt === undefined ||
          (memory.createdAt ?? 0) > (totals.lastCaptureCreatedAt ?? Number.NEGATIVE_INFINITY)
        ) {
          totals.lastCaptureCreatedAt = memory.createdAt;
          totals.lastCaptureMemoryId = memory._id;
          totals.lastCaptureTitle = memory.title;
          totals.lastCaptureStore = store;
        }
      }

      totals.activeStoreCount = Object.values(totals.activeMemoriesByStore).filter((count) => count > 0).length;

      if (page.isDone) {
        break;
      }
      if (page.pageStatus === "SplitRequired") {
        throw new Error("Dashboard totals source scan exceeded safe limits; rerun in smaller window");
      }
      cursor = page.continueCursor;
    }
  };

  const scanMessages = async () => {
    let cursor: string | null = null;
    while (true) {
      const page = (await ctx.db
        .query("crystalMessages")
        .withIndex("by_user_time", (q: any) => q.eq("userId", userId))
        .order("desc")
        .paginate({
          numItems: BASE_QUERY_PAGE_SIZE,
          cursor,
          maximumBytesRead: MAX_BYTES_PER_PAGE,
        })) as any;

      totals.totalMessages += page.page.length;

      if (page.isDone) {
        break;
      }
      if (page.pageStatus === "SplitRequired") {
        throw new Error("Dashboard totals source scan exceeded safe limits; rerun in smaller window");
      }
      cursor = page.continueCursor;
    }
  };

  await scanMemoryState(false);
  await scanMemoryState(true);
  await scanMessages();

  totals.updatedAt = Date.now();
  totals.activeStoreCount = Object.values(totals.activeMemoriesByStore).filter((count) => count > 0).length;
  return totals;
}

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
      const rebuilt = await computeDashboardTotalsFromSource(ctx, profile.userId);
      await writeTotals(ctx, profile.userId, rebuilt);
      count += 1;
    }
    return { usersProcessed: count };
  },
});
