import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/memories(.*)",
  "/messages(.*)",
  "/settings(.*)",
  "/checkpoints(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // After OAuth code exchange, the library redirects to /api/auth/signin/<provider>?redirectTo=...
  // That path isn't a real page, so redirect to the intended destination
  if (
    request.nextUrl.pathname.startsWith("/api/auth/signin/") &&
    request.nextUrl.searchParams.has("redirectTo") &&
    !request.nextUrl.searchParams.has("code")
  ) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/dashboard";
    return nextjsMiddlewareRedirect(request, redirectTo);
  }

  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
  return;
}, { verbose: true });

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
