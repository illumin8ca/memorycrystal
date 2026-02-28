import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.interval("vexclaw-decay", { hours: 24 }, api.vexclaw.decay.applyDecay, {});
crons.interval("vexclaw-consolidate", { hours: 12 }, api.vexclaw.consolidate.runConsolidation, {});
crons.interval("vexclaw-cleanup", { hours: 24 }, api.vexclaw.cleanup.runCleanup, {});
crons.interval("vexclaw-associate", { hours: 6 }, api.vexclaw.associations.buildAssociations, {});
crons.interval("stmEmbedder", { minutes: 5 }, api.vexclaw.stmEmbedder.embedUnprocessedMessages, {});
crons.daily("stm-expire", { hourUTC: 4, minuteUTC: 0 }, api.vexclaw.messages.expireOldMessages, {});

export default crons;
