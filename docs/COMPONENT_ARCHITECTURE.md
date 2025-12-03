# Component Architecture & Design System

This document explains the industrialized component architecture implemented in this project.

> Last Updated: 2025-06-10

## 📁 Structure Overview

```
lib/
├── api-routes/          # Centralized API endpoints
├── design-tokens/       # Design system tokens
└── test-ids/           # E2E test identifiers

components/shared/
├── GenericDataTable.tsx           # Core table with filters, pagination
├── GenericAssociationTable/       # CRUD tables with M2M support
│   ├── GenericAssociationTable.tsx
│   ├── AssociationExpansion.tsx
│   ├── AssociationDialog.tsx
│   └── types.ts
└── tables/                        # Table utilities
    ├── column-builders.tsx        # Column factory functions
    ├── filters/                   # Filter components
    └── index.ts
```

---

## 🔗 API Routes (`lib/api-routes/`)

Centralized API endpoint management to avoid hardcoded URLs.

### Files
- `auth.ts` - Authentication routes
- `identity.ts` - Identity service routes  
- `guardian.ts` - Guardian (RBAC) routes
- `index.ts` - Main export

### Usage Example

```typescript
import { AUTH_ROUTES, IDENTITY_ROUTES } from '@/lib/api-routes';

// Instead of: fetch('/api/auth/login', ...)
const res = await fetch(AUTH_ROUTES.login, {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

// With parameters
const userId = '123';
const res2 = await fetch(IDENTITY_ROUTES.user(userId));
```

### Benefits
✅ Refactoring: Change URL in one place  
✅ Type safety: TypeScript autocomplete  
✅ No typos: Compile-time errors for wrong routes  
✅ Documentation: Self-documenting API structure

---

## 🧪 Test IDs (`lib/test-ids/`)

Centralized test identifiers for E2E testing (Playwright, Selenium, etc.).

### Files
- `auth.ts` - Auth component IDs
- `common.ts` - Shared component IDs
- `dashboard.ts` - Dashboard component IDs
- `index.ts` - Main export with `testId()` helper

### Usage Example

```typescript
import { AUTH_TEST_IDS, testId } from '@/lib/test-ids';

// In component
<Input {...testId(AUTH_TEST_IDS.login.emailInput)} />
<Button {...testId(AUTH_TEST_IDS.login.submitButton)}>Login</Button>

// In E2E test (Playwright)
await page.getByTestId(AUTH_TEST_IDS.login.emailInput).fill('user@example.com');
await page.getByTestId(AUTH_TEST_IDS.login.submitButton).click();
```

### Benefits
✅ Stable selectors: No brittle CSS selectors  
✅ Refactoring safe: Change UI without breaking tests  
✅ Discoverable: All IDs in one place  
✅ Type-safe: Autocomplete prevents typos

---

## 🎨 Design Tokens (`lib/design-tokens/`)

Centralized design system values for consistent styling.

### Files
- `colors.ts` - Color variables and classes
- `icons.ts` - Icon sizes and colors
- `spacing.ts` - Spacing values
- `typography.ts` - Font settings
- `index.ts` - Main export

### Usage Example

```typescript
import { ICON_SIZES, ICON_COLORS, COLOR_CLASSES, SPACING } from '@/lib/design-tokens';

// Icons
<User className={`${ICON_SIZES.md} ${ICON_COLORS.waterfall}`} />

// Colors
<div className={COLOR_CLASSES.text.destructive}>Error message</div>

// Spacing
<form className={SPACING.component.md}>
  <div className={SPACING.gap.sm}>...</div>
</form>
```

### Available Tokens

#### Icon Sizes
```typescript
ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
}
```

#### Icon Colors
```typescript
ICON_COLORS = {
  primary: 'text-primary',
  waterfall: 'text-waterfall-icon',
  destructive: 'text-destructive',
  // ...
}
```

#### Spacing
```typescript
SPACING = {
  component: { xs: 'space-y-2', md: 'space-y-4', ... },
  gap: { xs: 'gap-1', sm: 'gap-2', md: 'gap-3', ... },
  padding: { xs: 'p-2', md: 'p-4', lg: 'p-6', ... },
}
```

### Benefits
✅ Consistency: Same spacing/colors everywhere  
✅ Theming: Change tokens, update whole app  
✅ Maintainability: No magic values scattered  
✅ Design system: Easy to enforce standards

---

## 📊 Table System (`components/shared/`)

The project uses a centralized table system for CRUD operations.

### Core Components

| Component | Purpose |
|-----------|---------|
| `GenericDataTable` | Base table with filtering, pagination, sorting |
| `GenericAssociationTable` | CRUD wrapper with M2M associations support |
| `column-builders.tsx` | Factory functions for common column types |
| `filters/` | Reusable filter components |

### Column Builders

Located in `components/shared/tables/column-builders.tsx`:

```typescript
import { 
  createFilterableTextColumn,
  createActionColumn,
  createBadgeColumn,
  createToggleColumn 
} from "@/components/shared/tables";

// Text column with sorting and filtering
const nameColumn = createFilterableTextColumn<User>("name", "Name", "users");

// Boolean badge column
const statusColumn = createBadgeColumn<User>(
  "is_active", "Status",
  (row) => row.is_active,
  { true: "Active", false: "Inactive" }
);

// Toggle column with PATCH
const activeColumn = createToggleColumn<User>(
  "is_active", "Active",
  (row) => row.is_active,
  (item, checked) => onPatch(item.id, { is_active: checked })
);

// Action buttons column
const actionsColumn = createActionColumn<User>(
  { onEdit, onDelete },
  { actions: "Actions", edit: "Edit", delete: "Delete" },
  "user"
);
```

### Filter Components

Located in `components/shared/tables/filters/`:

| Component | Usage |
|-----------|-------|
| `ColumnHeader` | Header with filter icon popover trigger |
| `TextFilter` | Simple text search filter |
| `MultiSelectFilter` | Checkbox-based multi-select (e.g., roles) |

```typescript
import { ColumnHeader, MultiSelectFilter } from "@/components/shared/tables/filters";

// In column definition
{
  accessorKey: "roles",
  header: ({ column }) => (
    <ColumnHeader column={column} title="Roles" testIdBase="users-roles" />
  ),
  meta: {
    filterComponent: (props) => (
      <MultiSelectFilter
        {...props}
        testIdBase="users-roles"
        getOptions={() => roles.map(r => ({ label: r.name, value: r.id }))}
      />
    ),
  },
}
```

### useTableCrud Hook

Located in `lib/hooks/useTableCrud.ts`:

```typescript
const { data, isLoading, create, update, patch, remove, refresh } = useTableCrud<User>({
  service: "identity",
  path: "/users",
  params: { limit: 1000 },
});

// PATCH for inline updates (toggles)
await patch(userId, { is_active: true });
await refresh();
```

### Benefits
✅ DRY: No code duplication across tables  
✅ Consistent UX: Same filters/actions everywhere  
✅ Type-safe: Full TypeScript support  
✅ Testable: Centralized test IDs  
✅ Extensible: Easy to add new column types

---

## 📦 Component Pattern

Recommended structure for new components:

```
components/
└── auth/
    └── LoginForm/
        ├── LoginForm.tsx       # Main component
        ├── LoginForm.types.ts  # TypeScript types
        ├── LoginForm.test.tsx  # Unit tests
        └── index.ts           # Exports
```

### Template Structure

```typescript
// LoginForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// UI Components
import { Card, Input, Button } from "@/components/ui";

// Constants
import { AUTH_ROUTES } from "@/lib/api-routes";
import { AUTH_TEST_IDS, testId } from "@/lib/test-ids";
import { ICON_SIZES, COLOR_CLASSES } from "@/lib/design-tokens";

// ==================== CONSTANTS ====================
const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// ==================== COMPONENT ====================
export function LoginForm({ onSuccess }: LoginFormProps) {
  // State
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const res = await fetch(AUTH_ROUTES.login, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    
    setIsLoading(false);
  };
  
  // Render
  return (
    <Card {...testId(AUTH_TEST_IDS.login.card)}>
      <form onSubmit={handleSubmit}>
        <Input 
          {...testId(AUTH_TEST_IDS.login.emailInput)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button {...testId(AUTH_TEST_IDS.login.submitButton)}>
          Submit
        </Button>
      </form>
    </Card>
  );
}
```

---

## 🧪 E2E Testing (Optional)

### Setup Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### Example Test

See `e2e/auth/login.spec.ts` for a complete example.

```typescript
import { test, expect } from '@playwright/test';
import { AUTH_TEST_IDS } from '@/lib/test-ids';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByTestId(AUTH_TEST_IDS.login.emailInput)
    .fill('user@example.com');
  await page.getByTestId(AUTH_TEST_IDS.login.submitButton)
    .click();
  
  await expect(page).toHaveURL('/welcome');
});
```

### Run Tests

```bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test e2e/auth/login.spec.ts

# Run in UI mode
npx playwright test --ui

# Run with browser visible
npx playwright test --headed
```

---

## ✅ Checklist for New Components

When creating a new component:

1. **Add test IDs** to `lib/test-ids/`
   - Create constants for all interactive elements
   - Use `testId()` helper in component

2. **Use API routes** from `lib/api-routes/`
   - Never hardcode URLs
   - Import from centralized constants

3. **Use design tokens** from `lib/design-tokens/`
   - Icons: `ICON_SIZES`, `ICON_COLORS`
   - Colors: `COLOR_CLASSES`
   - Spacing: `SPACING`

4. **Structure component properly**
   - Clear sections: imports, constants, types, handlers, render
   - TypeScript types in separate file if complex
   - Add `data-testid` to all testable elements

5. **Write E2E tests** (optional but recommended)
   - Cover happy path
   - Cover error cases
   - Test loading states

---

## 🎯 Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **URLs** | Scattered hardcoded strings | Centralized in `api-routes/` |
| **Test selectors** | CSS classes, brittle | Stable `data-testid` attributes |
| **Colors** | `text-red-500` everywhere | `COLOR_CLASSES.text.destructive` |
| **Icon sizes** | `w-5 h-5` hardcoded | `ICON_SIZES.md` token |
| **Refactoring** | Search & replace, risky | Change 1 constant, done |
| **Type safety** | Runtime errors | Compile-time errors |
| **Maintainability** | Hard to find what to change | Clear structure, easy updates |

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Design Tokens Spec](https://design-tokens.github.io/community-group/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about/#priority)

---

## 🚀 Next Steps

1. **Migrate existing components** to use this structure
2. **Add E2E tests** for critical user flows
3. **Expand design tokens** as design system grows
4. **Consider next-intl** for better i18n (see main architecture doc)
