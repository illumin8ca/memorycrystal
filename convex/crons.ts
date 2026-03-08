import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("crystal-decay", { hours: 24 }, api.crystal.decay.applyDecay, {});
crons.interval("crystal-consolidate", { hours: 12 }, api.crystal.consolidate.runConsolidation, {});
crons.interval("crystal-cleanup", { hours: 24 }, api.crystal.cleanup.runCleanup, {});
crons.interval("crystal-associate", { hours: 6 }, api.crystal.associations.buildAssociations, {});
crons.interval("stmEmbedder", { minutes: 5 }, api.crystal.stmEmbedder.embedUnprocessedMessages, {});
crons.daily("stm-expire", { hourUTC: 4, minuteUTC: 0 }, internal.crystal.messages.expireOldMessages, {});
// Daily reflection: runs after stm-expire, distils recent memories via LLM for all users
crons.daily("crystal-reflect", { hourUTC: 4, minuteUTC: 30 }, api.crystal.reflection.runReflection, {});

export default crons;
