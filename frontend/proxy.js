import { NextResponse } from "next/server";

/**
 * First-pass route protection for the admin panel.
 *
 * This is an *optimistic* check and nothing more: it looks at whether the
 * session cookie exists, so an obviously logged-out visitor is bounced to the
 * login page instead of watching a dashboard render and then vanish. It
 * cannot verify the token — the signing secret lives in the Express API and
 * never reaches the frontend.
 *
 * The real check is the backend's. Every /api/admin route re-verifies the JWT
 * and re-reads the account on every request, and the dashboard page fetches
 * through it before rendering, so a forged or expired cookie gets past this
 * file and no further.
 */

// Matches AUTH_COOKIE_NAME in backend/.env.
const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME || "admin_token";

// Reachable while logged out; everything else under /admin requires a session.
const PUBLIC_ADMIN_ROUTES = [
  "/admin/login",
  "/admin/forgot-password",
  "/admin/verify-otp",
  "/admin/reset-password",
];

export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isPublicRoute = PUBLIC_ADMIN_ROUTES.includes(pathname);

  if (!isPublicRoute && !hasSession) {
    const loginUrl = new URL("/admin/login", request.nextUrl);
    // Remember where they were headed so login can return them there.
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Deliberately no redirect in the other direction. Sending a cookie-bearing
  // visitor from /admin/login to /admin/dashboard would loop forever once that
  // cookie went stale: the dashboard would reject it and bounce back here,
  // which would bounce them straight to the dashboard again. The login page
  // handles that case itself, by asking the API whether the session is real.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
