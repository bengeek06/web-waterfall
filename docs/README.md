# Documentation

Welcome to the Waterfall project documentation!

## 🚀 Start Here

**New to the project?** Read the **[Developer Guide](./DEVELOPER_GUIDE.md)** first!

This comprehensive guide covers everything you need to build components:
- Architecture patterns
- Internationalization (i18n)
- Authentication & API calls
- Error handling
- Permissions system
- Form validation
- Testing & styling
- Component checklist

## 📚 Documentation Structure

### Core Guides

| Document | Purpose | Read if... |
|----------|---------|------------|
| **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** | Complete development guide | You're new or building a component |
| [COMPONENT_ARCHITECTURE.md](./COMPONENT_ARCHITECTURE.md) | Architecture deep dive | You need details on API routes, test IDs, design tokens |
| [DICTIONARIES.md](./DICTIONARIES.md) | i18n system reference | You're adding translations |
| [VALIDATION.md](./VALIDATION.md) | Form validation guide | You're building forms |
| [PERMISSIONS.md](./PERMISSIONS.md) | RBAC system reference | You're implementing access control |

### Auth & API

| Document | Purpose |
|----------|---------|
| [FETCH_WITH_AUTH.md](./FETCH_WITH_AUTH.md) | Authentication, retry logic, token refresh |
| [ERROR_HANDLER.md](./ERROR_HANDLER.md) | Global error handling with toasts |
| [LANGUAGE_PERSISTENCE.md](./LANGUAGE_PERSISTENCE.md) | User language preferences |

### Other

| Document | Purpose |
|----------|---------|
| [MOCK_MODE_GUIDE.md](./MOCK_MODE_GUIDE.md) | Developing without backend |

## 🎯 Quick Links

### Building a New Feature

1. Read: [Component Template](./DEVELOPER_GUIDE.md#component-template)
2. Create translations: [Adding New Translations](./DICTIONARIES.md#adding-new-translations)
3. Add validation: [Creating Custom Schemas](./VALIDATION.md#creating-custom-schemas)
4. Follow: [Component Checklist](./DEVELOPER_GUIDE.md#component-development-checklist)

### Common Tasks

- **Add i18n**: [Dictionaries Guide](./DICTIONARIES.md)
- **Authenticate API calls**: [fetchWithAuth](./FETCH_WITH_AUTH.md)
- **Handle errors**: [useErrorHandler](./ERROR_HANDLER.md)
- **Check permissions**: [usePermissions](./PERMISSIONS.md)
- **Validate forms**: [Zod + React Hook Form](./VALIDATION.md)
- **Add tests**: [Testing Guide](./DEVELOPER_GUIDE.md#testing)

### Standards

- **API Routes**: Always use `lib/api-routes/` (never hardcode URLs)
- **Test IDs**: Always use `lib/test-ids/` (for stable E2E selectors)
- **Design Tokens**: Use `lib/design-tokens/` (for consistency)
- **Translations**: Modular dictionaries by feature
- **Validation**: Centralized Zod schemas in `lib/validation/`

## 📖 Documentation Philosophy

**Single Source of Truth**: Each topic has ONE authoritative document.

**Layered Approach**:
1. **DEVELOPER_GUIDE.md** - Quick reference, common patterns, getting started
2. **Specific docs** - Deep dives for each system (auth, i18n, validation, etc.)

**Keep It Updated**: When you add a new feature, update the relevant docs!

## 🤝 Contributing to Docs

When adding new features:

1. **Update DEVELOPER_GUIDE.md** if it affects component development
2. **Create/update specific docs** for deep dives
3. **Keep examples simple** and copy-paste ready
4. **Use English** for all documentation
5. **Link between docs** to create a knowledge graph

## 📝 Document Status

All documents are **production-ready** and maintained.

Last major update: 2025-11-24 (Documentation cleanup & consolidation)

---

**Questions?** The [Developer Guide](./DEVELOPER_GUIDE.md) has answers! If not, ask the team.
