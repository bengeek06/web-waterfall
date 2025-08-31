/**
 * middleware.ts - Next.js middleware for locale detection and redirection
 * This middleware detects the user's preferred language and redirects to the appropriate locale route.
 */

import { NextResponse, NextRequest } from "next/server";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";

const locales = ["en", "fr"];
const defaultLocale = "en";

function getLocale(request: NextRequest) {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  // Filter out empty, invalid, or generic (*) values
  const filteredLanguages = languages.filter(
    (lang) =>
      typeof lang === "string" &&
      lang !== "*" &&
      /^[a-z]{2}(-[A-Z]{2})?$/.test(lang)
  );
  if (filteredLanguages.length === 0) return defaultLocale;

  return match(filteredLanguages, locales, defaultLocale);
}

/**
 * Middleware function to handle locale detection and redirection.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore Next.js internals and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return;
  }

  // Check if the locale is already present in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Detect the locale and redirect
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};