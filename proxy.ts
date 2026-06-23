import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "access_token";

const PROTECTED_PATHS = [
  "/bookings",
  "/profile",
  "/passengers",
  "/book",
  "/complete-profile",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  // Guard protected routes: bounce signed-out visitors to login. Preserve the
  // full path AND query in `next` so we return them to the exact same place —
  // e.g. a smart booking (/book/passengers?train=…&smart=1) survives the login
  // round-trip instead of losing its params.
  if (isProtected && !isAuthed) {
    const next = pathname + request.nextUrl.search;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  // NOTE: we deliberately do NOT redirect "authed" users away from /login,
  // /register, /otp here. The auth cookie is httpOnly, so middleware can only
  // see that it EXISTS — not that it's still valid. A stale/expired cookie would
  // otherwise trap the user in a loop: every visit to /login bounces back to /,
  // while the client (via /auth/me) correctly shows them as signed-out, so they
  // can never reach the form to re-authenticate. "Already signed in → skip the
  // auth pages" is handled client-side, where the real session status is known.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/bookings/:path*",
    "/profile/:path*",
    "/passengers/:path*",
    "/book/:path*",
    "/complete-profile",
  ],
};
