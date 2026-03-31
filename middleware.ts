import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPayloadRoute = (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  return (
    path.startsWith("/admin") ||
    path.startsWith("/api/users") ||
    path.startsWith("/api/posts") ||
    path.startsWith("/api/pages") ||
    path.startsWith("/api/media") ||
    path.startsWith("/api/globals") ||
    path.startsWith("/api/access") ||
    path.startsWith("/api/payload-preferences")
  );
};

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/preview(.*)",
  "/api/edgestore(.*)",
  "/blog(.*)",
  "/pages(.*)",
]);

export default function middleware(request: NextRequest) {
  if (isPayloadRoute(request)) {
    return NextResponse.next();
  }

  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
