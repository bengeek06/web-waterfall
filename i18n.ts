import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// ==================== CONFIGURATION ====================
export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

// ==================== REQUEST CONFIG ====================
export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    locale: locale as string,
    messages: (await import(`./dictionaries/${locale}.json`)).default,
  };
});
