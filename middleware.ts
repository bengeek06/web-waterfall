import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't use locale prefix for default locale (fr)
  // Users see /login instead of /fr/login
  localePrefix: 'as-needed',
});

export const config = {
  // Match only internationalized pathnames
  // Exclude API routes and static files
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/',
  ],
};
