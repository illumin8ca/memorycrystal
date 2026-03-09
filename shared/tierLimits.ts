export type UserTier = "free" | "starter" | "pro" | "ultra" | "unlimited";

export const TIER_ORDER: UserTier[] = ["free", "starter", "pro", "ultra", "unlimited"];

export type TierLimits = {
  memories: number | null;
  stmMessages: number | null;
  channels: number | null;
  stmTtlDays: number | null;
};

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: { memories: 500, stmMessages: 500, channels: 1, stmTtlDays: 30 },
  starter: { memories: 10_000, stmMessages: 5_000, channels: 5, stmTtlDays: 60 },
  pro: { memories: 25_000, stmMessages: 25_000, channels: null, stmTtlDays: 90 },
  ultra: { memories: 50_000, stmMessages: null, channels: null, stmTtlDays: 365 },
  unlimited: { memories: null, stmMessages: null, channels: null, stmTtlDays: 365 },
};

export const formatLimit = (value: number | null): string =>
  value === null ? "Unlimited" : value.toLocaleString();

export const formatTtlDays = (days: number | null): string => {
  if (days === null) return "Unlimited";
  if (days === 365) return "1 year";
  return `${days} days`;
};
