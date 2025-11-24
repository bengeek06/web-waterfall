# Dictionaries Structure - Modular Translation System

## 📁 Structure

```
dictionaries/
├── fr/                         # French translations
│   ├── common.json            # Common UI elements (welcome, description)
│   ├── navigation.json        # Navigation menu items (profile, users, roles)
│   ├── login.json             # Login page translations
│   ├── init-app.json          # Application initialization page
│   └── admin-users.json       # Admin users management page
│
├── en/                         # English translations (same structure)
│   ├── common.json
│   ├── navigation.json
│   ├── login.json
│   ├── init-app.json
│   └── admin-users.json
│
├── fr.json.old                 # Archived monolithic file
└── en.json.old                 # Archived monolithic file
```

## 🎯 Benefits

### 1. **Maintainability**
- ✅ Each feature/page has its own translation file
- ✅ Easy to find: login translations → `login.json`
- ✅ No more scrolling through 1000-line files

### 2. **Scalability**
- ✅ Add new features without bloating existing files
- ✅ Delete feature → delete its translation file
- ✅ Grow from 100 to 10,000 keys without issues

### 3. **Team Collaboration**
- ✅ Clear ownership: frontend team owns `admin-users.json`
- ✅ No merge conflicts: different teams edit different files
- ✅ Easy code reviews: changes are localized

### 4. **Organization**
- ✅ Logical grouping by feature/route
- ✅ Common elements separated from specific ones
- ✅ Clear naming convention

## 📖 Usage

### Server Components (Recommended)

```typescript
import { getDictionary } from '@/lib/utils/dictionaries';
import { getUserLanguage } from '@/lib/utils/locale';

export default async function MyPage() {
  const userLanguage = await getUserLanguage();
  const dictionary = await getDictionary(userLanguage);
  
  return (
    <div>
      {/* Common translations */}
      <h1>{dictionary.welcome}</h1>
      <p>{dictionary.description}</p>
      
      {/* Login component translations */}
      <label>{dictionary.login_component.email}</label>
      <input type="email" placeholder={dictionary.login_component.email} />
      
      {/* Admin users page translations */}
      <h2>{dictionary.admin_users.page_title}</h2>
      <button>{dictionary.admin_users.create_button}</button>
    </div>
  );
}
```

### Client Components

```typescript
"use client";

import { Dictionary } from '@/lib/utils/dictionaries';

interface Props {
  dictionary: Dictionary; // Type-safe!
}

export function MyClientComponent({ dictionary }: Props) {
  return (
    <div>
      <h1>{dictionary.welcome}</h1>
      <button>{dictionary.admin_users.create_button}</button>
    </div>
  );
}
```

## 🔧 Adding New Translations

### Step 1: Create Translation Files

```bash
# Create French translation
cat > dictionaries/fr/my-feature.json << 'EOF'
{
  "title": "Mon Titre",
  "description": "Ma Description",
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler"
  }
}
EOF

# Create English translation
cat > dictionaries/en/my-feature.json << 'EOF'
{
  "title": "My Title",
  "description": "My Description",
  "actions": {
    "save": "Save",
    "cancel": "Cancel"
  }
}
EOF
```

### Step 2: Import in `lib/dictionaries.ts`

```typescript
// Add imports
import myFeature_fr from '../dictionaries/fr/my-feature.json';
import myFeature_en from '../dictionaries/en/my-feature.json';

// Add to dictionaries object
const dictionaries = {
  fr: {
    ...common_fr,
    login_component: login_fr,
    init_app: initApp_fr,
    ...navigation_fr,
    admin_users: adminUsers_fr,
    my_feature: myFeature_fr,  // ← Add here
  },
  en: {
    ...common_en,
    login_component: login_en,
    init_app: initApp_en,
    ...navigation_en,
    admin_users: adminUsers_en,
    my_feature: myFeature_en,  // ← Add here
  },
};
```

### Step 3: Use in Component

```typescript
const dictionary = await getDictionary(userLanguage);
console.log(dictionary.my_feature.title);  // Type-safe!
console.log(dictionary.my_feature.actions.save);
```

## 🗂️ Organization Strategies

### By Route (Recommended)

Good for applications where translations are route-specific:

```
dictionaries/fr/
├── common.json              # Used everywhere
├── navigation.json          # TopBar, menus
├── login.json               # /login page
├── init-app.json            # /init-app page
├── admin-users.json         # /welcome/admin/users page
├── admin-roles.json         # /welcome/admin/roles page
├── profile.json             # /welcome/profile page
└── projects.json            # /welcome/projects page
```

### By Feature

Good for applications with shared components across routes:

```
dictionaries/fr/
├── common.json              # Global
├── forms.json               # Form labels, validation
├── tables.json              # Table headers, actions
├── modals.json              # Modal titles, buttons
├── errors.json              # Error messages
└── success.json             # Success messages
```

### Hybrid (Best of Both)

```
dictionaries/fr/
├── common.json              # Global UI
├── navigation.json          # Menus
├── forms.json               # Shared form elements
├── errors.json              # Shared errors
├── admin-users.json         # Page-specific
├── admin-roles.json         # Page-specific
└── projects.json            # Page-specific
```

## ⚡ Performance

### Tree-shaking
Only used translations are included in the bundle (thanks to static imports).

### Server-side Loading
Dictionaries load on the server, reducing client bundle size.

### Type Safety
TypeScript autocomplete for all translation keys!

```typescript
const dict = await getDictionary('fr');
dict.admin_users.  // ← Autocomplete shows: page_title, create_button, etc.
```

## 🚀 Migration from Monolithic

Your old files are backed up as:
- `dictionaries/fr.json.old`
- `dictionaries/en.json.old`

They can be deleted once you verify everything works!

## 📝 Naming Conventions

### File Names
- Lowercase with hyphens: `admin-users.json`, `init-app.json`
- Match route names when possible

### Dictionary Keys
- Use snake_case: `page_title`, `create_button`
- Group related items: `form.email`, `form.password`

### Translation Values
- Use proper capitalization
- French: "Créer un utilisateur"
- English: "Create User"

## ✅ Checklist for New Feature

- [ ] Create `dictionaries/fr/my-feature.json`
- [ ] Create `dictionaries/en/my-feature.json`
- [ ] Import both in `lib/dictionaries.ts`
- [ ] Add to `dictionaries` object
- [ ] Use in components: `dictionary.my_feature.xyz`
- [ ] Test in both languages (switch with LanguageSwitcher)

## 🔍 Troubleshooting

**Problem**: Translation key not found
```
dictionary.my_feature is undefined
```
**Solution**: Check that you imported and added to `dictionaries` object in `lib/dictionaries.ts`

**Problem**: Type error
```
Property 'xyz' does not exist on type 'Dictionary'
```
**Solution**: TypeScript infers types from `dictionaries.fr`. Make sure both fr and en have the same structure.

**Problem**: Language doesn't change
```
Still showing French after switching to English
```
**Solution**: 
1. Check that `LanguageSwitcher` calls `/api/user/language`
2. Verify user.language is updated in database
3. Hard refresh page (Ctrl+Shift+R)

## 📚 Related Documentation

- [Language Persistence](./LANGUAGE_PERSISTENCE.md) - User language preference system
- [Component Architecture](./COMPONENT_ARCHITECTURE.md) - Component design patterns
- [Validation](./VALIDATION.md) - Form validation with Zod

---

**Last Updated**: 2025-01-22  
**Status**: ✅ Production Ready
