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
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
  return;
});

export const config = {
  matcher: [
    "/(dashboard|memories|messages|settings|checkpoints)(.*)",
  ],
};
