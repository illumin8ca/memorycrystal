import { ConvexHttpClient } from "convex/browser";

type ConvexClient = ConvexHttpClient;

let cachedClient: ConvexClient | null = null;

export const getConvexClient = (): ConvexClient => {
  if (cachedClient) {
    return cachedClient;
  }

  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    // eslint-disable-next-line no-console
    console.warn("WARNING: CONVEX_URL is not set");
  } else if (convexUrl.includes("loyal-mongoose-173")) {
    // eslint-disable-next-line no-console
    console.warn("WARNING: CONVEX_URL points to deprecated deployment. Update to rightful-mockingbird-389.");
  }

  if (!convexUrl) {
    throw new Error("CONVEX_URL is required");
  }

  const client: ConvexClient = new ConvexHttpClient(convexUrl);
  cachedClient = client;
  return client;
};
