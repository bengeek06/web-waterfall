# Waterfall Developer Guide

> **Complete guide for building components in the Waterfall project**  
> Last Updated: 2025-11-24

This guide consolidates all essential information for developing components in this Next.js application, including architecture patterns, i18n, authentication, error handling, permissions, and validation.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Patterns](#architecture-patterns)
3. [Internationalization (i18n)](#internationalization-i18n)
4. [Authentication & API Calls](#authentication--api-calls)
5. [Error Handling](#error-handling)
6. [Permissions System](#permissions-system)
7. [Form Validation](#form-validation)
8. [Component Development](#component-development)
9. [Testing](#testing)
10. [Styling](#styling)
11. [API Integration](#api-integration)
12. [TypeScript Conventions](#typescript-conventions)

---

## 🎯 Project Overview

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **TypeScript**: 5.6+
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + @testing-library/react
- **Authentication**: JWT (httpOnly cookies)
- **State**: React hooks (no global state manager)

### Key Features

- ✅ Server-side authentication with middleware
- ✅ Proactive token refresh (60s before expiration)
- ✅ Retry logic with exponential backoff
- ✅ Type-safe i18n with modular dictionaries
- ✅ Global error handler with toast notifications
- ✅ Role-based access control (RBAC)
- ✅ Centralized API routes and test IDs

---

## 🏗️ Architecture Patterns

### Project Structure

```
app/                        # Next.js App Router
├── api/                   # API routes (proxy to backend)
├── login/                 # Public pages
├── init-app/              
└── home/                  # Authenticated pages

components/                 # React components
├── ui/                    # shadcn/ui components
├── modals/                # Reusable modals
└── [feature].tsx          # Feature components

lib/                        # Utilities and hooks
├── api-routes/            # Centralized API endpoints
├── design-tokens/         # Design system tokens
├── test-ids/              # E2E test identifiers
├── hooks/                 # Custom React hooks
├── validation/            # Zod schemas
├── fetchWithAuth.ts       # Authenticated fetch
├── permissions.ts         # RBAC utilities
├── dictionaries.ts        # i18n loader
└── ...

dictionaries/               # Translation files
├── en/                    # English translations
│   ├── common.json
│   ├── errors.json
│   └── [feature].json
└── fr/                    # French translations
    └── ...

middleware.ts               # Server-side auth middleware
```

---

## 📁 File and Directory Naming Conventions

**Consistent naming and organization are critical for maintainability.**

### Naming Rules

**1. Components (`components/`):**
- **UI primitives (`components/ui/`)**: `kebab-case.tsx` (shadcn/ui convention)
  - ✅ `button.tsx`, `card.tsx`, `dialog.tsx`
  - ❌ `Button.tsx`, `Card.tsx`
- **Business components**: `PascalCase.tsx` (React convention)
  - ✅ `UserManagement.tsx`, `CustomerList.tsx`
  - ❌ `user-management.tsx`, `customer-list.tsx`
- **Test files**: Match component name + `.test.tsx`
  - ✅ `UserManagement.test.tsx` for `UserManagement.tsx`
  - ✅ `button.test.tsx` for `button.tsx`

**2. Pages (`app/`):**
- **Route segments**: `kebab-case/` (Next.js convention)
  - ✅ `app/user-profile/page.tsx`
  - ❌ `app/userProfile/page.tsx`, `app/user_profile/page.tsx`

**3. Libraries (`lib/`):**

Organize `lib/` by **execution context and functionality** to maintain clear separation of concerns:

```
lib/
├── auth/                        # Authentication utilities
│   ├── fetchWithAuth.ts        # Client-side authenticated fetch
│   ├── fetchWithAuth.test.ts
│   ├── fetchWithAuthServer.ts  # Server-side authenticated fetch
│   ├── tokenRefreshScheduler.ts
│   ├── tokenRefreshScheduler.test.ts
│   ├── tokenUtils.ts
│   └── tokenUtils.test.ts
├── client/                      # Client-side only utilities
│   ├── retryWithBackoff.ts
│   └── retryWithBackoff.test.ts
├── server/                      # Server-side only utilities
│   ├── retryWithBackoffServer.ts
│   └── user.ts
├── utils/                       # Shared utilities (client + server)
│   ├── dictionaries.ts
│   ├── locale.ts
│   ├── locale.test.ts
│   ├── logger.ts
│   ├── permissions.ts
│   ├── permissions.test.ts
│   └── utils.ts
├── api-routes/                  # Centralized API endpoints
├── design-tokens/               # Design system tokens
├── hooks/                       # React hooks (client-side)
├── proxy/                       # API proxy utilities
├── test-ids/                    # E2E test identifiers
└── validation/                  # Zod schemas
```

**Naming conventions:**
- **Directories**: `kebab-case/` (e.g., `api-routes/`, `design-tokens/`)
- **Files**: `camelCase.ts` (e.g., `fetchWithAuth.ts`, `permissions.ts`)
- **Test files**: Match source name + `.test.ts` (e.g., `fetchWithAuth.test.ts`)

**Organization principles:**
- **Separation by context**: Distinguish client-side, server-side, and shared code
- **Avoid suffixes**: Use directories instead of `*Server.ts` suffixes (exception: existing dual implementations during migration)
- **Colocation**: Keep tests adjacent to source files
- **Logical grouping**: Group related utilities (auth, validation, hooks, etc.)

**4. Dictionaries (`dictionaries/`):**
- **Language folders**: `lowercase/` (ISO 639-1 codes)
  - ✅ `en/`, `fr/`, `de/`
- **Dictionary files**: `kebab-case.json`
  - ✅ `common.json`, `user-management.json`

### Directory Organization

**Recommended structure for `components/`:**

```
components/
├── ui/                          # shadcn/ui primitives (kebab-case)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── modals/                      # All modal dialogs (kebab-case)
│   ├── user-form-modal.tsx
│   ├── confirm-delete-modal.tsx
│   └── organization-unit-modal.tsx
├── admin/                       # Admin-specific features (PascalCase)
│   ├── UserManagement.tsx
│   ├── UserDataTable.tsx
│   └── index.ts
├── pages/                       # Page-level components (PascalCase)
│   ├── Customers.tsx
│   ├── Roles.tsx
│   └── Policies.tsx
├── layout/                      # Layout components (PascalCase)
│   ├── TopBar.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
└── shared/                      # Shared utilities (PascalCase)
    ├── AuthGuard.tsx
    ├── LanguageSwitcher.tsx
    └── ProtectedCard.tsx
```

### Rules Summary

| Type | Location | Naming | Example |
|------|----------|--------|---------|
| UI Primitive | `components/ui/` | kebab-case | `button.tsx` |
| Modal | `components/modals/` | kebab-case | `user-form-modal.tsx` |
| Business Component | `components/admin/` | PascalCase | `UserManagement.tsx` |
| Page Component | `components/pages/` | PascalCase | `Customers.tsx` |
| Layout Component | `components/layout/` | PascalCase | `TopBar.tsx` |
| Shared Component | `components/shared/` | PascalCase | `AuthGuard.tsx` |
| Utility Function | `lib/` | camelCase/kebab-case | `fetchWithAuth.ts` |
| Test File | Same as component | Match + `.test.tsx` | `UserManagement.test.tsx` |
| Route Segment | `app/` | kebab-case | `user-profile/` |
| Dictionary File | `dictionaries/[lang]/` | kebab-case | `admin-users.json` |

**Migration Note:** Existing components not following these conventions should be gradually refactored. Create an issue to track the migration plan.

---

## 🏗️ Architecture Patterns

### Centralized Constants

#### API Routes (`lib/api-routes/`)

**Never hardcode URLs**. All API endpoints are centralized for type safety and easy refactoring.

```typescript
import { AUTH_ROUTES, IDENTITY_ROUTES, GUARDIAN_ROUTES } from '@/lib/api-routes';

// ✅ Good
const res = await fetch(AUTH_ROUTES.login, { method: 'POST' });
const user = await fetch(IDENTITY_ROUTES.user(userId));

// ❌ Bad
const res = await fetch('/api/auth/login', { method: 'POST' });
```

**Available route modules:**
- `AUTH_ROUTES` - Authentication endpoints
- `IDENTITY_ROUTES` - User management
- `GUARDIAN_ROUTES` - RBAC (roles, policies, permissions)
- `PROJECT_ROUTES` - Project management
- `BASIC_IO_ROUTES` - File operations

#### Test IDs (`lib/test-ids/`)

Centralized test identifiers for E2E testing and component testing.

```typescript
import { AUTH_TEST_IDS, DASHBOARD_TEST_IDS, testId } from '@/lib/test-ids';

// In component
<Input {...testId(AUTH_TEST_IDS.login.emailInput)} />
<Button {...testId(AUTH_TEST_IDS.login.submitButton)}>Login</Button>

// In tests
await screen.getByTestId(AUTH_TEST_IDS.login.emailInput);
```

**Benefits:**
- ✅ Stable selectors (no brittle CSS)
- ✅ Refactoring-safe
- ✅ Type-safe autocomplete
- ✅ Self-documenting

**Important for Selenium E2E:**
The `testId()` helper generates both `data-testid` AND `id` attributes, making elements easily accessible for Selenium WebDriver tests running in a separate project.

```typescript
// testId() generates BOTH attributes:
<Input {...testId('login-email')} />
// Results in:
// <input data-testid="login-email" id="login-email" />

// This enables Selenium to find elements by ID:
// driver.findElement(By.id("login-email"))
```

#### Design Tokens (`lib/design-tokens/`)

Centralized design system values for consistency.

```typescript
import { ICON_SIZES, ICON_COLORS, COLOR_CLASSES, SPACING } from '@/lib/design-tokens';

// Icons
<User className={`${ICON_SIZES.md} ${ICON_COLORS.primary}`} />

// Colors
<div className={COLOR_CLASSES.text.destructive}>Error message</div>

// Spacing
<form className={SPACING.component.md}>
  <div className={SPACING.gap.sm}>...</div>
</form>
```

---

## 🌍 Internationalization (i18n)

### Dictionary System

The project uses a **modular dictionary system** (not next-intl). Translations are organized by feature for scalability.

#### Structure

```
dictionaries/
├── en/
│   ├── common.json          # Global UI elements
│   ├── navigation.json      # Menu items
│   ├── errors.json          # Error messages
│   ├── login.json           # Login page
│   └── admin-users.json     # Admin users page
└── fr/                      # Same structure
```

#### Usage in Server Components

```typescript
import { getDictionary } from '@/lib/utils/dictionaries';
import { getUserLanguage } from '@/lib/utils/locale';

export default async function MyPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  return (
    <div>
      <h1>{dictionary.common.welcome}</h1>
      <p>{dictionary.admin_users.page_title}</p>
    </div>
  );
}
```

#### Usage in Client Components

Pass dictionary as prop from parent Server Component:

```typescript
"use client";

import { Dictionary } from '@/lib/utils/dictionaries';

interface Props {
  dictionary: Dictionary; // Type-safe!
}

export function MyClientComponent({ dictionary }: Props) {
  return <h1>{dictionary.common.welcome}</h1>;
}
```

#### Adding New Translations

1. **Create translation files:**
```bash
# English
cat > dictionaries/en/my-feature.json << 'EOF'
{
  "title": "My Title",
  "save": "Save",
  "cancel": "Cancel"
}
EOF

# French
cat > dictionaries/fr/my-feature.json << 'EOF'
{
  "title": "Mon Titre",
  "save": "Enregistrer",
  "cancel": "Annuler"
}
EOF
```

2. **Import in `lib/dictionaries.ts`:**
```typescript
import myFeature_en from '../dictionaries/en/my-feature.json';
import myFeature_fr from '../dictionaries/fr/my-feature.json';

const dictionaries = {
  en: {
    // ... other imports
    my_feature: myFeature_en,
  },
  fr: {
    // ... other imports
    my_feature: myFeature_fr,
  },
};
```

3. **Use in component:**
```typescript
const dictionary = await getDictionary(lang);
console.log(dictionary.my_feature.title); // Type-safe autocomplete!
```

#### Language Persistence

- **Public pages** (`/login`, `/init-app`): Browser locale detection
- **Authenticated pages**: User's stored language preference from database
- **Switching**: `LanguageSwitcher` component calls `/api/identity/users/{id}` to update preference

---

## 🔐 Authentication & API Calls

### Overview

The authentication system includes:
- Server-side middleware for protected routes
- Automatic token refresh (60s before expiration)
- Retry logic with exponential backoff
- Client and server fetch utilities

### Client-Side: `fetchWithAuth`

**Always use `fetchWithAuth` instead of `fetch`** for authenticated requests.

```typescript
import { fetchWithAuth, fetchWithAuthJSON } from '@/lib/fetchWithAuth';

// Basic usage (returns Response)
const response = await fetchWithAuth('/api/users/123');
const data = await response.json();

// JSON helper (auto-parse, throws on error)
const user = await fetchWithAuthJSON<User>('/api/users/123');

// With options
const response = await fetchWithAuth('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John' }),
  retryOptions: { maxRetries: 3 },
  skipRetry: false, // Disable retry if needed
});
```

**Features:**
- ✅ Automatic JWT refresh on 401 errors
- ✅ Retry with exponential backoff (2 retries, 1s initial, 2x factor, 10s max)
- ✅ Prevents multiple simultaneous refresh calls
- ✅ Redirects to `/login` if refresh fails
- ✅ Includes credentials (httpOnly cookies) automatically

### Server-Side: `fetchWithAuthServer`

For Server Components and API routes:

```typescript
import { fetchWithAuthServer } from '@/lib/fetchWithAuthServer';
import { cookies } from 'next/headers';

export async function MyServerComponent() {
  const cookieStore = await cookies();
  
  const response = await fetchWithAuthServer(
    '/api/identity/users/123',
    cookieStore
  );
  
  const user = await response.json();
  return <div>{user.name}</div>;
}
```

### Token Refresh

Proactive token refresh happens automatically:
- Scheduler checks token every 30s
- Refreshes when <60s remaining before expiration
- Uses `/api/auth/token-info` to get expiration time
- Runs in background without blocking UI

**No manual intervention needed!**

### Retry Logic

Built-in retry for transient errors:

```typescript
// Retries automatically on network errors and 5xx
const data = await fetchWithAuthJSON('/api/data');

// Customize retry behavior
const data = await fetchWithAuth('/api/data', {
  retryOptions: {
    maxRetries: 5,
    initialDelay: 2000,
  }
});

// Disable retry
const data = await fetchWithAuth('/api/data', { skipRetry: true });
```

**Error types:**
- `NETWORK` - Connection issues (retryable)
- `SERVER_ERROR` (5xx) - Backend issues (retryable)
- `UNAUTHORIZED` (401) - Triggers token refresh
- `FORBIDDEN` (403) - Not retryable
- `NOT_FOUND` (404) - Not retryable
- `CLIENT_ERROR` (4xx) - Not retryable
- `UNKNOWN` - Unexpected errors

---

## ⚠️ Error Handling

### Global Error Handler

The `useErrorHandler` hook provides centralized error handling with i18n and toast notifications.

#### Basic Usage

```typescript
"use client";

import { useErrorHandler } from '@/lib/hooks/useErrorHandler';

export function MyComponent({ dictionary }) {
  const { handleError } = useErrorHandler({ 
    messages: dictionary.errors // From dictionaries/*/errors.json
  });

  async function loadData() {
    try {
      const data = await fetchWithAuthJSON('/api/data');
      setData(data);
    } catch (error) {
      handleError(error); // Auto-displays toast with translated message
    }
  }

  return <button onClick={loadData}>Load</button>;
}
```

#### Advanced Options

```typescript
const { handleError } = useErrorHandler({ 
  messages: dictionary.errors,
  showToast: true,           // Show toast notification (default: true)
  duration: 5000,            // Toast duration in ms (default: 5000)
  onError: (error) => {      // Custom action on error
    if (error.type === 'UNAUTHORIZED') {
      // Redirect to login, etc.
    }
    // Log to analytics, Sentry, etc.
  }
});
```

#### Error Messages

Error messages are in `dictionaries/{en,fr}/errors.json`:

```json
{
  "network": "Network connection error. Please check your internet.",
  "unauthorized": "Your session has expired. Please log in again.",
  "forbidden": "You don't have permission to perform this action.",
  "notFound": "The requested resource was not found.",
  "serverError": "Server error. Please try again later.",
  "clientError": "Invalid request. Please check your input.",
  "unknown": "An unexpected error occurred."
}
```

#### Toast Notifications

The global `<Toaster />` component (Sonner) is integrated in `app/layout.tsx`. No setup needed in components.

**Toast types:**
- **Error toast** (red): Network, server, client errors
- **Warning toast** (yellow): Session expired (401)

#### Migration Example

```typescript
// ❌ Before
try {
  await fetchAPI();
} catch (error) {
  console.error(error);
  setErrorMessage('An error occurred');
}

// ✅ After
try {
  await fetchAPI();
} catch (error) {
  handleError(error); // Handles toast + logging automatically
}
```

---

## 🔒 Permissions System

### Overview

Role-Based Access Control (RBAC) with Guardian service:
- **Roles**: Groups of policies (e.g., "Admin", "User")
- **Policies**: Collections of permissions (e.g., "User Management")
- **Permissions**: Specific actions on resources (e.g., "users:READ")

### Checking Permissions

#### In Components

```typescript
import { usePermissions } from '@/lib/hooks/usePermissions';

export function MyComponent() {
  const { hasPermission, permissions, isLoading } = usePermissions();

  if (isLoading) return <Spinner />;

  return (
    <div>
      {hasPermission('users', 'CREATE') && (
        <button>Create User</button>
      )}
      
      {hasPermission('roles', 'UPDATE') && (
        <button>Edit Role</button>
      )}
    </div>
  );
}
```

#### Protected UI Components

```typescript
import { ProtectedCard } from '@/components/ProtectedCard';

<ProtectedCard 
  requiredPermissions={[
    { resource: 'users', operation: 'READ' }
  ]}
  fallback={<p>You don't have access to this section</p>}
>
  <UserManagementPanel />
</ProtectedCard>
```

### Permission Format

Permissions follow the pattern: `service:resource:operation`

**Operations:**
- `CREATE` - Create new resources
- `READ` - View resources
- `UPDATE` - Modify existing resources
- `DELETE` - Remove resources
- `LIST` - List/search resources

**Examples:**
```typescript
hasPermission('users', 'READ')      // Can view users
hasPermission('users', 'CREATE')    // Can create users
hasPermission('roles', 'UPDATE')    // Can edit roles
hasPermission('policies', 'DELETE') // Can delete policies
```

### Available Permissions Hook

To get all system permissions (for admin UI):

```typescript
import { useAvailablePermissions } from '@/lib/hooks/useAvailablePermissions';

export function PermissionSelector() {
  const { permissions, isLoading } = useAvailablePermissions();

  return (
    <select>
      {permissions.map(p => (
        <option key={p.id} value={p.id}>
          {p.service}:{p.resource_name}:{p.operation}
        </option>
      ))}
    </select>
  );
}
```

---

## ✅ Form Validation

### Zod + React Hook Form

The project uses **Zod** for schema validation and **React Hook Form** for form state management.

#### Basic Usage

```typescript
import { useZodForm } from '@/lib/hooks';
import { loginSchema, LoginFormData } from '@/lib/validation';

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // data is fully typed and validated!
    await fetch(AUTH_ROUTES.login, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} />
      {errors.email && <span className="text-red-500">{errors.email.message}</span>}
      
      <Input type="password" {...register('password')} />
      {errors.password && <span className="text-red-500">{errors.password.message}</span>}
      
      <Button type="submit" disabled={isSubmitting}>
        Login
      </Button>
    </form>
  );
}
```

#### Available Schemas

**Auth** (`lib/validation/auth.schemas.ts`):
- `loginSchema` → `LoginFormData`
- `registerSchema` → `RegisterFormData`
- `initAppSchema` → `InitAppFormData`
- `changePasswordSchema` → `ChangePasswordFormData`

**Guardian** (`lib/validation/guardian.schemas.ts`):
- `policySchema` → `PolicyFormData`
- `roleSchema` → `RoleFormData`
- `permissionSchema` → `PermissionFormData`

**Identity** (`lib/validation/identity.schemas.ts`):
- `userSchema` → `UserFormData`
- `organizationUnitSchema` → `OrganizationUnitFormData`
- `positionSchema` → `PositionFormData`

**Project** (`lib/validation/project.schemas.ts`):
- `projectSchema` → `ProjectFormData`
- `fileSchema` → `FileFormData`

#### Creating Custom Schemas

```typescript
// lib/validation/my-feature.schemas.ts
import { z } from 'zod';

export const myFeatureSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  age: z.number().min(18, 'Must be 18 or older'),
});

export type MyFeatureFormData = z.infer<typeof myFeatureSchema>;
```

#### Advanced Validation

```typescript
// Custom validation logic
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Conditional fields
const schema = z.object({
  type: z.enum(['individual', 'company']),
  companyName: z.string().optional(),
}).refine(data => {
  if (data.type === 'company') {
    return !!data.companyName;
  }
  return true;
}, {
  message: 'Company name is required',
  path: ['companyName'],
});
```

---

## 🧩 Component Development

### Component Template

Recommended structure for new components:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// UI Components
import { Card, Input, Button } from "@/components/ui";
import { Save, X } from "lucide-react"; // Icons

// Constants & Utilities
import { AUTH_ROUTES } from "@/lib/api-routes";
import { AUTH_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";
import { fetchWithAuthJSON } from "@/lib/fetchWithAuth";
import { useErrorHandler } from "@/lib/hooks/useErrorHandler";
import { useZodForm } from "@/lib/hooks";
import { myFeatureSchema, MyFeatureFormData } from "@/lib/validation";

// Types
interface MyComponentProps {
  dictionary: Dictionary;
}

// ==================== COMPONENT ====================
export function MyComponent({ dictionary }: MyComponentProps) {
  // State
  const [data, setData] = useState([]);
  const router = useRouter();
  
  // Hooks
  const { handleError } = useErrorHandler({ messages: dictionary.errors });
  const { register, handleSubmit, formState: { errors } } = useZodForm({
    schema: myFeatureSchema,
  });
  
  // Handlers
  const onSubmit = async (formData: MyFeatureFormData) => {
    try {
      const result = await fetchWithAuthJSON(AUTH_ROUTES.myEndpoint, {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setData(result);
    } catch (error) {
      handleError(error);
    }
  };
  
  // Render
  return (
    <Card {...testId(AUTH_TEST_IDS.myComponent.card)}>
      <h1 className={COLOR_CLASSES.text.primary}>
        {dictionary.my_feature.title}
      </h1>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input {...register('name')} {...testId(AUTH_TEST_IDS.myComponent.nameInput)} />
        {errors.name && <span className={COLOR_CLASSES.text.destructive}>{errors.name.message}</span>}
        
        <Button type="submit" {...testId(AUTH_TEST_IDS.myComponent.submitButton)}>
          <Save className={ICON_SIZES.sm} />
          {dictionary.my_feature.submit}
        </Button>
        
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <X className={ICON_SIZES.sm} />
          {dictionary.common.cancel}
        </Button>
      </form>
    </Card>
  );
}
```

### Component Organization

#### Code Sections

Organize code in this order:
1. **Imports**: Group by category (React, UI, utilities, types)
2. **Types/Interfaces**: Component props, local types
3. **Constants**: Static data, configuration
4. **Component**: Main function
5. **State**: `useState`, `useRef`
6. **Hooks**: Custom hooks, context
7. **Effects**: `useEffect`, side effects
8. **Handlers**: Event handlers, callbacks
9. **Render helpers**: Functions that return JSX
10. **Render**: Main JSX return

#### File Structure

For complex components:
```
components/
└── MyFeature/
    ├── MyFeature.tsx          # Main component
    ├── MyFeature.types.ts     # TypeScript types
    ├── MyFeature.test.tsx     # Unit tests
    ├── MyFeature.utils.ts     # Helper functions
    └── index.ts               # Exports
```

### Best Practices

✅ **DO:**
- Use Server Components by default (add `"use client"` only when needed)
- Pass dictionaries as props from Server to Client Components
- Use `fetchWithAuth` for all authenticated requests
- Handle errors with `useErrorHandler`
- Add `data-testid` to all interactive elements
- Use design tokens for colors, spacing, icons
- Use Lucide icons for all icon needs
- Validate forms with Zod schemas
- Check permissions with `usePermissions`

❌ **DON'T:**
- Hardcode API URLs (use `api-routes`)
- Hardcode test selectors (use `test-ids`)
- Use `fetch` directly (use `fetchWithAuth`)
- Mix icon libraries (use Lucide only)
- Ignore error handling
- Mix concerns (keep logic separate from UI)
- Duplicate validation logic (use shared schemas)

---

## 🧪 Testing

### Unit Tests with Jest

The project uses **Jest** and **@testing-library/react** for unit testing.

#### Basic Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyComponent } from './MyComponent';
import { AUTH_TEST_IDS } from '@/lib/test-ids';

describe('MyComponent', () => {
  it('should render with title', () => {
    render(<MyComponent dictionary={mockDictionary} />);
    
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    render(<MyComponent dictionary={mockDictionary} />);
    
    const input = screen.getByTestId(AUTH_TEST_IDS.myComponent.nameInput);
    const button = screen.getByTestId(AUTH_TEST_IDS.myComponent.submitButton);
    
    fireEvent.change(input, { target: { value: 'John' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
```

### E2E Tests with Selenium

The project is designed to work with external Selenium WebDriver tests. All interactive elements should have proper IDs.

#### Selenium Test Example (Python)

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Setup
driver = webdriver.Chrome()
driver.get("http://localhost:3000/login")

# Find elements by ID (generated by testId())
email_input = driver.find_element(By.ID, "login-email-input")
password_input = driver.find_element(By.ID, "login-password-input")
submit_button = driver.find_element(By.ID, "login-submit-button")

# Interact with elements
email_input.send_keys("user@example.com")
password_input.send_keys("password123")
submit_button.click()

# Wait for navigation
WebDriverWait(driver, 10).until(
    EC.url_contains("/home")
)

# Verify success
assert "Welcome" in driver.page_source

driver.quit()
```

#### Adding Test IDs for Selenium

**Always use the `testId()` helper** - it generates both `data-testid` and `id` attributes:

```typescript
import { testId } from '@/lib/test-ids';

// ✅ Good - Generates both data-testid AND id
<Input {...testId('user-email-input')} />
<Button {...testId('save-button')}>Save</Button>
<div {...testId('user-card-123')}>Content</div>

// Results in:
// <input data-testid="user-email-input" id="user-email-input" />
// <button data-testid="save-button" id="save-button">Save</button>
// <div data-testid="user-card-123" id="user-card-123">Content</div>

// ❌ Bad - Only data-testid, Selenium can't find by ID
<Input data-testid="user-email-input" />
```

**Best Practices for Selenium:**
- ✅ Use `testId()` for ALL interactive elements (inputs, buttons, links)
- ✅ Use `testId()` for container elements you need to verify
- ✅ Use descriptive IDs: `user-email-input` not `input1`
- ✅ Include entity IDs in dynamic content: `user-card-${userId}`
- ✅ Keep IDs stable across refactoring

#### Mocking fetchWithAuth

```typescript
import { fetchWithAuth } from '@/lib/fetchWithAuth';

jest.mock('@/lib/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
  fetchWithAuthJSON: jest.fn(),
}));

// In test
(fetchWithAuthJSON as jest.Mock).mockResolvedValue({ data: 'mock' });
```

#### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Run specific test
npm test -- MyComponent.test.tsx
```

### Important: Mock Responses for Retry Logic

When mocking `fetch` responses, include a `clone()` method for compatibility with retry logic:

```typescript
const mockFetch = () => {
  const response = {
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: 'test' }),
    clone: function() { 
      return { ...this, json: () => Promise.resolve({ data: 'test' }) }; 
    }
  };
  return Promise.resolve(response);
};

global.fetch = jest.fn(mockFetch);
```

### Test Timeouts

For tests that use `fetchWithAuth` (which includes retry logic), increase `waitFor` timeouts:

```typescript
await waitFor(() => {
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
}, { timeout: 5000 }); // Retry logic takes 3+ seconds (1s + 2s delays)
```

---

## 🎨 Styling

### Tailwind CSS + shadcn/ui

The project uses **Tailwind CSS 4** for utility-first styling and **shadcn/ui** for component primitives.

#### Using shadcn/ui Components

Components are in `components/ui/`:

```typescript
import { Button, Input, Card, Dialog, Select } from '@/components/ui';

<Button variant="default" size="md">Click me</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Input placeholder="Enter name" />
<Card className="p-4">Content</Card>
```

#### Using Lucide Icons

The project uses **Lucide React** for icons. Browse available icons at [lucide.dev](https://lucide.dev/).

```typescript
import { User, Mail, Lock, Trash2, Edit, Check, X, ChevronDown } from 'lucide-react';
import { ICON_SIZES, ICON_COLORS } from '@/lib/design-tokens';

// Basic usage
<User className="w-5 h-5" />

// With design tokens (recommended)
<User className={`${ICON_SIZES.md} ${ICON_COLORS.primary}`} />
<Mail className={`${ICON_SIZES.sm} ${ICON_COLORS.waterfall}`} />
<Trash2 className={`${ICON_SIZES.md} ${ICON_COLORS.destructive}`} />

// In buttons
<Button>
  <Check className={ICON_SIZES.sm} />
  Save
</Button>

// Common icons
<Edit className="w-4 h-4" />      // Edit action
<Trash2 className="w-4 h-4" />    // Delete action
<Plus className="w-4 h-4" />      // Add/Create
<Search className="w-4 h-4" />    // Search
<Settings className="w-4 h-4" />  // Settings
<ChevronDown className="w-4 h-4" /> // Dropdown
```

**Best Practices:**
- ✅ Use semantic icon names (e.g., `Trash2` not `Delete`)
- ✅ Always set size with design tokens or explicit classes
- ✅ Use consistent sizes across similar actions (all edit buttons = same size)
- ✅ Pair icons with text for clarity (except obvious actions)
- ❌ Don't mix icon libraries (stick to Lucide)

#### Custom Styling

Prefer design tokens over raw Tailwind classes:

```typescript
// ✅ Good
<div className={COLOR_CLASSES.text.primary}>Text</div>
<Icon className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`} />
<form className={SPACING.component.md}>...</form>

// ❌ Avoid (not reusable)
<div className="text-blue-600">Text</div>
<Icon className="w-5 h-5 text-primary" />
<form className="space-y-4">...</form>
```

#### Theming

The app supports light/dark mode via `next-themes`:

```typescript
import { useTheme } from 'next-themes';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  );
}
```

---

## 🔌 API Integration

### API Route Structure

API routes in `app/api/` proxy to backend microservices:

```
app/api/
├── auth/              # Authentication service
│   ├── login/
│   ├── logout/
│   ├── refresh/
│   └── token-info/
├── identity/          # User/organization management
│   ├── users/
│   ├── organization_units/
│   └── positions/
├── guardian/          # RBAC
│   ├── roles/
│   ├── policies/
│   └── permissions/
├── project/           # Project management
│   └── projects/
└── basic-io/          # File operations
    └── files/
```

### Creating New API Routes

```typescript
// app/api/my-service/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { forwardRequest } from '@/lib/proxy';

export async function GET(request: NextRequest) {
  return forwardRequest(request, '/backend/my-service/my-endpoint');
}

export async function POST(request: NextRequest) {
  return forwardRequest(request, '/backend/my-service/my-endpoint', {
    method: 'POST',
  });
}
```

### Proxy Utilities

The `forwardRequest` function handles:
- Cookie forwarding (request & response)
- Header forwarding
- Authentication token passing
- Error handling
- Content streaming

---

## 📘 TypeScript Conventions

### Type Safety Rules

1. **No `any`**: Use proper types or `unknown`
2. **No `as` casting**: Use type guards
3. **Use interfaces** for object shapes
4. **Use type** for unions/intersections
5. **Export types** from `*.types.ts` files

### Common Patterns

#### Dictionary Types

```typescript
import { Dictionary } from '@/lib/utils/dictionaries';

interface Props {
  dictionary: Dictionary; // Auto-inferred from dictionaries
}
```

#### API Response Types

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user = await fetchWithAuthJSON<User>('/api/users/123');
// user is typed as User
```

#### Form Data Types

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

type FormData = z.infer<typeof schema>; // Infer from schema
```

#### Component Props

```typescript
interface MyComponentProps {
  title: string;
  onClose: () => void;
  dictionary: Dictionary;
  optional?: boolean;
}

export function MyComponent({ title, onClose, dictionary }: MyComponentProps) {
  // ...
}
```

---

## ✅ Component Development Checklist

When creating a new component, ensure:

### Architecture
- [ ] Use Server Component by default (add `"use client"` only if needed)
- [ ] Import API routes from `lib/api-routes/`
- [ ] Import test IDs from `lib/test-ids/`
- [ ] Import design tokens from `lib/design-tokens/`

### Internationalization
- [ ] Create `dictionaries/en/my-feature.json`
- [ ] Create `dictionaries/fr/my-feature.json`
- [ ] Import in `lib/dictionaries.ts`
- [ ] Pass dictionary as prop to Client Components
- [ ] Use `dictionary.my_feature.key` for all text

### Authentication & Data
- [ ] Use `fetchWithAuth` for client-side requests
- [ ] Use `fetchWithAuthServer` for server-side requests
- [ ] Handle errors with `useErrorHandler`
- [ ] Add retry logic where appropriate
- [ ] Check permissions with `usePermissions` if needed

### Validation
- [ ] Create Zod schema in `lib/validation/`
- [ ] Export type with `z.infer<typeof schema>`
- [ ] Use `useZodForm` hook
- [ ] Display validation errors

### Testing
- [ ] Add test IDs to all interactive elements
- [ ] Write unit tests with Jest
- [ ] Mock `fetchWithAuth` properly
- [ ] Include `clone()` in mock responses
- [ ] Use extended timeouts for retry logic tests

### Styling
- [ ] Use shadcn/ui components
- [ ] Use design tokens for colors/spacing/icons
- [ ] Support light/dark mode
- [ ] Ensure responsive design

### Code Quality
- [ ] Add TypeScript types (no `any`)
- [ ] Organize code in clear sections
- [ ] Add JSDoc comments for public APIs
- [ ] Follow naming conventions
- [ ] Handle loading/error states

---

## 📚 Additional Resources

- **Architecture**: [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md)
- **i18n**: [DICTIONARIES.md](./DICTIONARIES.md)
- **Auth**: [FETCH_WITH_AUTH.md](./FETCH_WITH_AUTH.md)
- **Errors**: [ERROR_HANDLER.md](./ERROR_HANDLER.md)
- **Permissions**: [PERMISSIONS.md](./PERMISSIONS.md)
- **Validation**: [VALIDATION.md](./VALIDATION.md)

---

## 🚀 Quick Start

### 1. Create a new feature

```bash
# Create translation files
cat > dictionaries/en/my-feature.json << 'EOF'
{ "title": "My Feature" }
EOF

cat > dictionaries/fr/my-feature.json << 'EOF'
{ "title": "Ma Fonctionnalité" }
EOF

# Add to lib/dictionaries.ts
# Create component file
touch components/my-feature.tsx
touch components/my-feature.test.tsx
```

### 2. Implement component

Follow the [Component Template](#component-template) above.

### 3. Add test IDs

```typescript
// lib/test-ids/my-feature.ts
export const MY_FEATURE_TEST_IDS = {
  card: 'my-feature-card',
  input: 'my-feature-input',
  submitButton: 'my-feature-submit',
} as const;
```

### 4. Write tests

See [Testing](#testing) section.

### 5. Run & verify

```bash
npm run dev          # Start dev server
npm test             # Run tests
npm run lint         # Check linting
```

---

**Questions?** Check the detailed docs in the links above or ask the team!
