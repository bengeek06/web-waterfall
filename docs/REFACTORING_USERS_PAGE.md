Oui, vous avez absolument raison ! La page `app/welcome/admin/users/page.tsx` devrait être refactorisée selon les principes définis dans la documentation.

## Problèmes actuels

1. ❌ **Texte en dur** - Tous les labels sont en français
2. ❌ **Pas de validation Zod** - Validation manuelle avec setFormError
3. ❌ **Pas de test IDs** - Impossible de faire des tests E2E robustes
4. ❌ **Pas d'API routes centralisées** - URLs hardcodées
5. ❌ **Pas de design tokens** - Classes Tailwind en dur
6. ❌ **Composant monolithique** - 280+ lignes "use client"

## Refactoring recommandé

### Étapes à suivre :

1. **Créer les schémas Zod** ✅ (déjà fait dans `lib/validation/identity.schemas.ts`)
   - `createUserSchema` 
   - `updateUserSchema`

2. **Ajouter les test IDs** ✅ (créé `lib/test-ids/admin.ts`)
   - Identifiants pour tous les éléments interactifs

3. **Ajouter les traductions** ✅ (ajouté dans `dictionaries/`)
   - `fr.json` et `en.json` avec section `admin_users`

4. **Créer un composant UserFormModal** (en cours)
   - Utilise Zod + validation appropriée
   - Utilise les test IDs
   - Utilise les design tokens
   - Utilise les API routes centralisées
   - Support i18n

5. **Créer UserDataTable** (à faire)
   - Tableau avec colonnes localisées
   - Actions (edit/delete) avec test IDs
   - Utilise design tokens

6. **Transformer la page en Server Component** (à faire)
   - Récupère la langue utilisateur
   - Charge les traductions
   - Passe le dictionary aux composants client

## Fichiers créés/modifiés

- ✅ `lib/validation/identity.schemas.ts` - Schémas create/update user
- ✅ `lib/test-ids/admin.ts` - Test IDs pour admin pages
- ✅ `dictionaries/fr.json` - Traductions françaises
- ✅ `dictionaries/en.json` - Traductions anglaises
- 🔄 `components/admin/UserFormModal.tsx` - Modal de formulaire (en cours de création)
- ⏳ `components/admin/UserDataTable.tsx` - Table de données (à créer)
- ⏳ `components/admin/UserDeleteDialog.tsx` - Dialog de confirmation (à créer)
- ⏳ `app/welcome/admin/users/page.tsx` - Page refactorisée (à transformer)

Le composant UserFormModal est partiellement créé mais nécessite d'être complété. Voulez-vous que je continue le refactoring complet ou préférez-vous une approche progressive ?
