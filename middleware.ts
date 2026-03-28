import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin pages and admin API routes
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi =
    pathname.startsWith("/api/posts") &&
    request.method !== "GET" &&
    pathname !== "/api/auth/login";
  const isAiApi = pathname.startsWith("/api/ai");

  if (isAdminPage || isAdminApi || isAiApi) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token || !(await verifyToken(token))) {
      if (isAdminPage) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/posts/:path*",
    "/api/ai/:path*",
  ],
};
