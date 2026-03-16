import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/preview(.*)",
  "/api/edgestore(.*)",
  "/admin(.*)",
  "/api/users(.*)",
  "/api/posts(.*)",
  "/api/pages(.*)",
  "/api/media(.*)",
  "/api/globals(.*)",
  "/api/access(.*)",
  "/blog(.*)",
  "/pages(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
