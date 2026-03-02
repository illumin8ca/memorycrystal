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

const isAuthRoute = createRouteMatcher(["/login", "/signup"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthed = await convexAuth.isAuthenticated();

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute(request) && !isAuthed) {
    return nextjsMiddlewareRedirect(request, "/login");
  }

  // Redirect authenticated users away from auth pages and homepage
  if (isAuthed && (isAuthRoute(request) || request.nextUrl.pathname === "/")) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  return;
}, { verbose: true });

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
