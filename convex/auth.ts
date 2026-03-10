import { convexAuth } from "@convex-dev/auth/server";
import GitHub from "@auth/core/providers/github";
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

const githubClientId = process.env.AUTH_GITHUB_ID;
const githubClientSecret = process.env.AUTH_GITHUB_SECRET;
const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: Email({
        maxAge: 60 * 15,
        sendVerificationRequest: async ({ identifier, token }) => {
          await sendPasswordResetEmail({
            to: identifier,
            code: token,
          });
        },
      }),
      verify: Email({
        maxAge: 60 * 15,
        sendVerificationRequest: async ({ identifier, token }) => {
          await sendVerificationEmail({
            to: identifier,
            code: token,
          });
        },
      }),
    }),
    ...(githubClientId && githubClientSecret
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],
});
