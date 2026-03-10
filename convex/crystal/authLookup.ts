import { v } from "convex/values";
import { query } from "../_generated/server";

// Public query - returns which auth providers exist for a given email
// Does NOT reveal any sensitive data, just provider names
export const getAuthMethodsForEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();

    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), normalizedEmail))
      .collect();

    if (users.length === 0) {
      return { exists: false, providers: [] };
    }

    const providers: string[] = [];
    for (const user of users) {
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) => q.eq("userId", user._id))
        .collect();
    
      for (const account of accounts) {
        if (!providers.includes(account.provider)) {
          providers.push(account.provider);
        }
      }
    }

    return { exists: true, providers };
  },
});
