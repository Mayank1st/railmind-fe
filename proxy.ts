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
const AUTH_PATHS = ["/login", "/register", "/otp"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthed = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  const isAuthRoute = AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (isProtected && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/bookings/:path*",
    "/profile/:path*",
    "/passengers/:path*",
    "/book/:path*",
    "/complete-profile",
    "/login",
    "/register",
    "/otp",
  ],
};
