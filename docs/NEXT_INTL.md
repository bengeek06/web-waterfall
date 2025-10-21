# Next-intl Configuration Guide

## 📚 Overview

This project uses **next-intl** for internationalization (i18n) with type-safe translations, automatic locale detection, and seamless integration with Next.js App Router.

## 🚀 Features

- ✅ **Type Safety**: Full TypeScript autocomplete for translation keys
- ✅ **Automatic Locale Detection**: Browser language detection + cookie persistence
- ✅ **Locale Prefix**: `as-needed` strategy (no `/fr` prefix for default locale)
- ✅ **Server & Client**: Works in both Server and Client Components
- ✅ **Hot Reload**: Translations update instantly during development
- ✅ **Language Switcher**: Built-in dropdown component

## 📁 File Structure

```
app/
  [locale]/                    # Dynamic locale segment
    layout.tsx                 # Locale-aware layout
    login/                     # Example localized page
      page.tsx
  api/                         # API routes (not localized)
    ...
  globals.css
  layout.tsx                   # Root layout (metadata only)

components/
  LanguageSwitcher.tsx         # Language dropdown component
  TopBar.tsx                   # Updated with translations

dictionaries/
  en.json                      # English translations
  fr.json                      # French translations (default)

i18n.ts                        # next-intl configuration
i18n-types.d.ts               # TypeScript definitions
middleware.ts                  # Locale routing middleware
```

## 🔧 Configuration Files

### 1. `i18n.ts`
```typescript
import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ locale }) => {
  return {
    locale: locale as string,
    messages: (await import(`./dictionaries/${locale}.json`)).default,
  };
});
```

### 2. `middleware.ts`
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed', // /login instead of /fr/login
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/'],
};
```

### 3. `i18n-types.d.ts` (Type Safety)
```typescript
import type fr from './dictionaries/fr.json';

declare global {
  interface IntlMessages extends typeof fr {}
}
```

### 4. `next.config.ts`
```typescript
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

export default withNextIntl(nextConfig);
```

## 🎯 Usage

### Server Components

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{t('login_component.email')}</p>
    </div>
  );
}
```

### Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function ClientComponent() {
  const t = useTranslations();
  
  return <button>{t('login_component.submit')}</button>;
}
```

### With Namespace

```tsx
const t = useTranslations('login_component');

// Now you can use shorter keys:
t('email')     // instead of t('login_component.email')
t('password')  // instead of t('login_component.password')
```

### With Parameters

```json
{
  "greeting": "Hello {name}!",
  "items_count": "You have {count, plural, =0 {no items} one {# item} other {# items}}"
}
```

```tsx
t('greeting', { name: 'John' })             // Hello John!
t('items_count', { count: 0 })              // You have no items
t('items_count', { count: 1 })              // You have 1 item
t('items_count', { count: 5 })              // You have 5 items
```

### Rich Text

```json
{
  "welcome": "Welcome to <bold>Waterfall</bold>!"
}
```

```tsx
t.rich('welcome', {
  bold: (chunks) => <strong>{chunks}</strong>
})
```

## 🌐 Language Switcher Component

The `LanguageSwitcher` component is already integrated in `TopBar`:

```tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

// In your layout or component:
<LanguageSwitcher />
```

Features:
- 🎨 Dropdown with flags (🇬🇧 🇫🇷)
- 🔄 Instant locale switching
- ✅ Shows current locale with checkmark
- 📱 Responsive (hides text on mobile)

## 📝 Translation Files

### Structure Example (`dictionaries/fr.json`)

```json
{
  "welcome": "Bienvenue sur Waterfall",
  "profile": "Votre profil",
  
  "login_component": {
    "login": "Se connecter",
    "email": "Adresse e-mail",
    "password": "Mot de passe",
    "submit": "Soumettre",
    "invalid_email": "Format d'e-mail invalide."
  },
  
  "init_app": {
    "title": "Initialiser l'application",
    "company": {
      "title": "Saisissez le nom de votre entreprise",
      "label": "Nom de l'entreprise"
    }
  }
}
```

### Adding New Translations

1. **Add to French** (`dictionaries/fr.json`):
```json
{
  "new_feature": {
    "title": "Nouveau titre",
    "description": "Description en français"
  }
}
```

2. **Add to English** (`dictionaries/en.json`):
```json
{
  "new_feature": {
    "title": "New title",
    "description": "Description in English"
  }
}
```

3. **Use in Component**:
```tsx
const t = useTranslations('new_feature');
<h1>{t('title')}</h1>
<p>{t('description')}</p>
```

4. **TypeScript Autocomplete**: Works automatically! 🎉

## 🔄 Routing

### URL Structure

With `localePrefix: 'as-needed'`:

| Locale | URL | Visible Path |
|--------|-----|--------------|
| French (default) | `/login` | `/login` |
| English | `/en/login` | `/en/login` |

### Navigation

```tsx
import { Link } from 'next/navigation';

// Automatically uses current locale:
<Link href="/welcome">Go to Welcome</Link>

// With locale parameter:
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/en/welcome'); // Force English
```

## 🧪 Testing

### Unit Tests

```tsx
import { NextIntlClientProvider } from 'next-intl';
import messages from '@/dictionaries/fr.json';

// Wrap component in provider:
render(
  <NextIntlClientProvider messages={messages} locale="fr">
    <YourComponent />
  </NextIntlClientProvider>
);
```

### Integration Tests

Translations are automatically available in all pages under `[locale]` segment.

## 🎨 Type Safety Examples

### ✅ Valid (TypeScript Happy)

```tsx
t('welcome')                          // ✅ Key exists
t('login_component.email')           // ✅ Nested key exists
t('init_app.company.title')          // ✅ Deep nested key
```

### ❌ Invalid (TypeScript Error)

```tsx
t('non_existent_key')                // ❌ Property 'non_existent_key' does not exist
t('login_component.typo')            // ❌ Property 'typo' does not exist
```

## 🚀 Migration from Old System

### Before (Old System)

```tsx
import { getDictionary } from '@/lib/dictionaries';

const dictionary = await getDictionary('fr');
<h1>{dictionary.welcome}</h1>
<p>{dictionary.login_component.email}</p>
```

### After (next-intl)

```tsx
import { getTranslations } from 'next-intl/server';

const t = await getTranslations();
<h1>{t('welcome')}</h1>
<p>{t('login_component.email')}</p>
```

**Benefits**:
- ✅ Automatic locale detection (no hardcoded 'fr')
- ✅ Type safety (autocomplete + errors)
- ✅ Language switcher support
- ✅ Better performance (streaming)
- ✅ ICU message format support

## 📦 Dependencies

```json
{
  "next-intl": "^3.x"
}
```

## 🔗 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/)
- [Next.js Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

## 🎯 Best Practices

1. **Group Related Translations**: Use nested objects for components/features
2. **Use Namespaces**: `useTranslations('component_name')` for shorter keys
3. **Keep Keys Descriptive**: `login_button_submit` better than `btn1`
4. **Synchronize Files**: Always update both `en.json` and `fr.json`
5. **Use Parameters**: For dynamic content (names, counts, dates)
6. **Test Both Locales**: Switch language and verify translations

## 🐛 Common Issues

### Issue: "Cannot find module 'next-intl/server'"
**Solution**: Make sure `next-intl` is installed: `npm install next-intl`

### Issue: Translations not updating
**Solution**: Restart dev server (translations are cached)

### Issue: TypeScript autocomplete not working
**Solution**: Ensure `i18n-types.d.ts` exists and restart TypeScript server

### Issue: 404 on locale routes
**Solution**: Check that middleware matcher includes your routes

## 🎉 Summary

next-intl provides:
- 🌍 Multi-language support (FR + EN + more)
- 🔒 Type-safe translations
- 🎨 Beautiful language switcher
- ⚡ Server & client components
- 🚀 Production-ready performance
- 📝 Clean, maintainable code

All existing pages work automatically under the new `[locale]` routing structure!
