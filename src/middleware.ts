import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow access to handler routes (sign-in, sign-up, etc.)
  if (request.nextUrl.pathname.startsWith("/handler")) {
    return NextResponse.next();
  }

  // Skip auth check if Stack Auth is not configured
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  if (!projectId) {
    return NextResponse.next();
  }

  // Dynamic import to avoid build-time crash
  const { stackServerApp } = await import("@/lib/auth");
  const user = await stackServerApp.getUser();

  // Redirect unauthenticated users to sign-in
  if (!user) {
    return NextResponse.redirect(new URL("/handler/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, public assets, and api
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|api|fonts|uploads).*)",
  ],
};
