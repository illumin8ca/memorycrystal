/**
 * TODO: If you upgrade convex-auth setup, you can regenerate this with
 * `npx @convex-dev/auth` and keep the generated providers as-is.
 * TODO: Wire Auth providers from env if you need OAuth in production:
 * AUTH_GITHUB_ID and AUTH_GITHUB_SECRET.
 */

import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import { Password } from "@convex-dev/auth/providers/Password";

const githubClientId = process.env.AUTH_GITHUB_ID;
const githubClientSecret = process.env.AUTH_GITHUB_SECRET;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    ...(githubClientId && githubClientSecret
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
  ],
});
