# Language Persistence Strategy

This document describes the implementation of the language preference persistence strategy for the application.

## Overview

The application supports two locales: **French (fr)** and **English (en)**, with French as the default. The locale strategy varies depending on whether the user is authenticated or not.

## Locale Strategy

### Public Pages (Non-Authenticated)
- **Pages**: `/login`, `/init-app`
- **Strategy**: Use browser locale detection via `Accept-Language` header
- **Default**: French (fr) if no preference detected
- **Implementation**: Handled automatically by `next-intl` middleware

### Authenticated Pages
- **Pages**: `/welcome/*` (all pages under welcome)
- **Strategy**: Use user's stored language preference from database
- **Source**: `language` field from `GET /api/identity/users/{user_id}`
- **Override**: User preference overrides browser locale
- **Fallback**: French (fr) if API call fails or user has no language set

### Language Switcher
- **Location**: Available on all authenticated pages
- **Behavior**: 
  1. Updates URL to new locale immediately
  2. Makes PATCH request to `/api/user/language` to persist preference
  3. Continues even if API call fails (graceful degradation)
- **Persistence**: Stores language in database via `PATCH /api/identity/users/{user_id}`

## Architecture

### Files Created

#### 1. `lib/locale.ts`
Helper functions for locale management:

- **`getUserId()`**: Extract user ID from JWT cookie
- **`getCompanyId()`**: Extract company ID from JWT cookie
- **`getUserLanguage()`**: Fetch user's language preference from Identity Service
- **`updateUserLanguage(language)`**: Update user's language preference in database

**Dependencies**:
- `jwt-decode`: For decoding JWT tokens
- `next/headers`: For accessing cookies server-side

**Error Handling**:
- Returns default locale (fr) on any error
- Logs errors to console for debugging
- Never throws, always returns a valid locale

#### 2. `app/api/user/language/route.ts`
API route for updating user language:

- **Method**: PATCH
- **Body**: `{ language: "en" | "fr" }`
- **Validation**: Ensures language is either "en" or "fr"
- **Response**: `{ success: true, language: string }` or error
- **Status Codes**:
  - 200: Success
  - 400: Invalid language
  - 500: Update failed or internal error

#### 3. `components/LanguageSwitcher.tsx` (Enhanced)
Client component with language persistence:

- **Features**:
  - Dropdown with flag emojis (🇫🇷 FR, 🇬🇧 EN)
  - Loading state during update
  - Disabled state during API call
  - Current language indicator (✓)
- **Behavior**:
  - Only persists for authenticated routes (`/welcome/*`)
  - Public routes just update URL
  - Graceful degradation if API fails

### Test Coverage

#### `lib/locale.test.ts` (14 tests)
Tests for locale helper functions:

- ✅ `getUserId()`: valid token, missing token, invalid token
- ✅ `getCompanyId()`: valid token, missing token
- ✅ `getUserLanguage()`: success, not authenticated, API failure, network error, missing language
- ✅ `updateUserLanguage()`: success, not authenticated, API failure, network error

#### `app/api/user/language/route.test.ts` (6 tests)
Tests for API route:

- ✅ Update to "en" successfully
- ✅ Update to "fr" successfully
- ✅ Return 400 for invalid language
- ✅ Return 400 for missing language
- ✅ Return 500 if update fails
- ✅ Return 500 on exception

**Total**: 20 new tests, all passing ✅

## API Integration

### Identity Service API

**User Schema**:
```yaml
User:
  properties:
    language: 
      type: string
      enum: [en, fr]
      description: User's preferred language
```

**GET /users/{user_id}**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "language": "en"
}
```

**PATCH /users/{user_id}**:
```json
// Request
{
  "language": "fr"
}

// Response
{
  "id": "uuid",
  "email": "user@example.com",
  "language": "fr"
}
```

**Authentication**: All endpoints require JWT authentication via cookies (`token` cookie with `user_id` and `company_id` claims).

## Environment Variables

```bash
# Identity Service API URL
IDENTITY_API_URL=http://localhost:5002
```

**Default**: `http://localhost:5002` if not set

## Flow Diagrams

### Public Page Flow (Login/Init-App)
```
User visits /login
    ↓
Middleware detects browser locale (Accept-Language)
    ↓
Redirects to /en/login or /fr/login (or default)
    ↓
Page renders in detected locale
```

### Authenticated Page Flow (Welcome)
```
User visits /welcome (authenticated)
    ↓
Server fetches user language from GET /users/{user_id}
    ↓
Redirects to /fr/welcome or /en/welcome based on user.language
    ↓
Page renders in user's preferred locale
```

### Language Switch Flow
```
User clicks language switcher
    ↓
LanguageSwitcher.handleLocaleChange(newLocale)
    ↓
If authenticated route:
    ↓
    PATCH /api/user/language { language: newLocale }
        ↓
        Update database: users.language = newLocale
    ↓
Update URL: pathname.replace(locale, newLocale)
    ↓
Router navigates to new locale
    ↓
Page re-renders in new language
```

## Usage Examples

### Server Component (Authenticated Page)
```typescript
// app/[locale]/welcome/page.tsx
import { getUserLanguage } from '@/lib/utils/locale';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function WelcomePage({ params }: { params: { locale: string } }) {
  // Ensure user's preferred language is used
  const userLang = await getUserLanguage();
  if (params.locale !== userLang) {
    redirect(`/${userLang}/welcome`);
  }
  
  const t = await getTranslations('welcome');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      {/* ... */}
    </div>
  );
}
```

### Client Component with Language Switcher
```typescript
// app/[locale]/welcome/layout.tsx
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav>
        <LanguageSwitcher />
      </nav>
      {children}
    </div>
  );
}
```

### Programmatic Language Update
```typescript
import { updateUserLanguage } from '@/lib/utils/locale';

// Server-side only
async function changeLanguage(newLang: 'en' | 'fr') {
  const success = await updateUserLanguage(newLang);
  if (success) {
    console.log('Language updated successfully');
  }
}
```

## Edge Cases & Error Handling

### Case 1: User Not Authenticated
- `getUserLanguage()` returns default locale (fr)
- `updateUserLanguage()` returns false, logs error

### Case 2: Identity Service Down
- `getUserLanguage()` returns default locale (fr)
- `updateUserLanguage()` returns false
- LanguageSwitcher still updates UI, but preference not persisted

### Case 3: Invalid JWT Token
- `getUserId()` returns null
- Treated same as "not authenticated"

### Case 4: User Has No Language Set (null in DB)
- `getUserLanguage()` returns default locale (fr)
- Next update will set user's language

### Case 5: Browser Sends Invalid Accept-Language
- Middleware uses default locale (fr)
- User can manually switch via LanguageSwitcher

## Performance Considerations

### Caching
- `getUserLanguage()` uses `cache: 'no-store'` to always fetch fresh data
- Ensures language changes are immediately reflected
- Consider adding short-term cache (1-5 minutes) if API load is high

### Optimization Opportunities
1. **Cache user language in session cookie** (avoid API call on every page)
2. **Use SWR/React Query for client-side caching**
3. **Add Redis cache layer in Identity Service**

## Security

### JWT Authentication
- All Identity Service endpoints require valid JWT
- Token contains `user_id` and `company_id` claims
- Middleware validates token on every request

### Input Validation
- API route validates language is exactly "en" or "fr"
- Prevents injection attacks
- TypeScript ensures type safety

### CORS
- API routes inherit Next.js CORS configuration
- Cookies use `SameSite=Strict` (default)

## Troubleshooting

### Language Not Persisting
1. Check browser console for API errors
2. Verify JWT token is valid (`document.cookie`)
3. Check Identity Service logs for PATCH request
4. Ensure `IDENTITY_API_URL` is correct

### Wrong Language Displayed
1. Check user's language in database
2. Verify middleware is running (check Network tab)
3. Ensure locale parameter in URL matches expected
4. Clear browser cache and cookies

### Tests Failing
1. Ensure `@jest-environment node` is set for API route tests
2. Mock `next/headers` and `jwt-decode` properly
3. Check global `fetch` mock is defined
4. Run `npm test -- --verbose` for detailed output

## Future Enhancements

1. **Add more locales** (es, de, it, etc.)
2. **RTL support** for Arabic/Hebrew
3. **Locale-specific date/number formatting**
4. **Translation management UI** for non-developers
5. **A/B testing** for locale detection strategies
6. **Analytics** to track language usage patterns

## Related Documentation

- [next-intl Documentation](../docs/NEXT_INTL.md)
- [Identity API Specification](../.spec/identity_api.yml)
- [Middleware Configuration](../middleware.ts)
- [i18n Configuration](../i18n.ts)
