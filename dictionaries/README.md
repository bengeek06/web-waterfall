# Dictionaries - Quick Reference

## Adding a New Feature Translation

### 1. Create Translation Files

```bash
# French
touch dictionaries/fr/my-feature.json

# English  
touch dictionaries/en/my-feature.json
```

### 2. Add Content

**dictionaries/fr/my-feature.json**:
```json
{
  "title": "Mon Titre",
  "subtitle": "Mon Sous-titre",
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer"
  },
  "messages": {
    "success": "Opération réussie",
    "error": "Une erreur est survenue"
  }
}
```

**dictionaries/en/my-feature.json**:
```json
{
  "title": "My Title",
  "subtitle": "My Subtitle",
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "messages": {
    "success": "Operation successful",
    "error": "An error occurred"
  }
}
```

### 3. Import in lib/dictionaries.ts

```typescript
// Add imports at top
import myFeature_fr from '../dictionaries/fr/my-feature.json';
import myFeature_en from '../dictionaries/en/my-feature.json';

// Add to dictionaries object
const dictionaries = {
  fr: {
    // ... existing
    my_feature: myFeature_fr,  // ← Add this
  },
  en: {
    // ... existing
    my_feature: myFeature_en,  // ← Add this
  },
};
```

### 4. Use in Code

```typescript
// Server Component
const dictionary = await getDictionary(userLanguage);
<h1>{dictionary.my_feature.title}</h1>

// Client Component (pass dictionary as prop)
<MyComponent dictionary={dictionary.my_feature} />
```

## Current Features

| File | Key in Code | Used In |
|------|-------------|---------|
| `common.json` | `dictionary.welcome` | Global |
| `navigation.json` | `dictionary.users` | TopBar |
| `login.json` | `dictionary.login_component.email` | Login page |
| `init-app.json` | `dictionary.init_app.title` | Init page |
| `admin-users.json` | `dictionary.admin_users.page_title` | Admin users |

## Testing

```bash
# 1. Build
npm run build

# 2. Run tests
npm test

# 3. Manual test
# - Start dev server: npm run dev
# - Switch language with globe icon in TopBar
# - Verify all text changes
```

See [DICTIONARIES.md](./DICTIONARIES.md) for complete documentation.
