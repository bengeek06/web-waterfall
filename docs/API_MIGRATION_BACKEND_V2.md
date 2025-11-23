# Migration API Backend V2

**Date**: Novembre 2025  
**Auteur**: Benjamin  
**Branche**: `feature/update-api-backend-evolution`

## 📋 Vue d'ensemble

Les services backend Identity et Guardian ont évolué pour améliorer la sécurité et simplifier l'utilisation des APIs. Le changement majeur est l'**extraction automatique** de `company_id` et `user_id` depuis le token JWT, éliminant le besoin de les envoyer dans le body des requêtes.

## 🔑 Changement Principal

### Avant
```typescript
// ❌ Ancienne façon - envoyer company_id dans le body
const response = await fetch('/api/identity/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Customer Name',
    company_id: 'company-123',  // ❌ Plus nécessaire
    email: 'customer@example.com'
  })
});
```

### Après
```typescript
// ✅ Nouvelle façon - company_id extrait automatiquement du JWT
const response = await fetch('/api/identity/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Customer Name',
    email: 'customer@example.com'
  })
});
```

## 📚 Changements par Service

### Identity Service

#### Endpoints affectés
Tous les endpoints de **création** (POST) n'acceptent plus `company_id` dans le body :

- `/customers` - Création de clients
- `/subcontractors` - Création de sous-traitants
- `/organization_units` - Création d'unités organisationnelles
- `/positions` - Création de postes
- `/users` - Création d'utilisateurs

#### Schémas mis à jour

**CustomerCreate** (avant)
```typescript
{
  name: string,
  company_id: string,  // ❌ Retiré
  email?: string,
  contact_person?: string,
  ...
}
```

**CustomerCreate** (après)
```typescript
{
  name: string,
  email?: string,
  contact_person?: string,
  ...
}
// company_id est automatiquement assigné depuis le JWT
```

**OrganizationUnitCreate** (avant)
```typescript
{
  name: string,
  company_id: string,  // ❌ Retiré
  description?: string,
  parent_id?: string
}
```

**OrganizationUnitCreate** (après)
```typescript
{
  name: string,
  description?: string,
  parent_id?: string
}
```

**PositionCreate** (avant)
```typescript
{
  title: string,
  company_id: string,  // ❌ Retiré
  organization_unit_id: string,
  description?: string,
  level?: number
}
```

**PositionCreate** (après)
```typescript
{
  title: string,
  organization_unit_id: string,
  description?: string,
  level?: number
}
```

#### Endpoints non affectés
- `/verify_password` - Pas d'authentification JWT requise
- Endpoints de lecture (GET) - Déjà filtrés par JWT

### Guardian Service

#### Endpoints affectés
Tous les endpoints Guardian respectent maintenant l'extraction automatique :

- `/roles` (POST) - Création de rôles
- `/policies` (POST) - Création de politiques
- `/user-roles` (POST) - Attribution de rôles

**Note importante** : L'endpoint `/user-roles` (POST) continue d'accepter `user_id` et `role_id` dans le body car ces IDs ne sont pas extraits du JWT (ils représentent les entités à associer).

#### Endpoint /init-db

L'endpoint `/init-db` (POST) accepte maintenant **deux formats** pour plus de flexibilité :

**Format plat** (recommandé)
```typescript
{
  company_id: "123e4567-e89b-12d3-a456-426614174000",
  user_id: "987fcdeb-51a2-43d1-9f12-345678901234"
}
```

**Format imbriqué** (legacy)
```typescript
{
  company: {
    company_id: "123e4567-e89b-12d3-a456-426614174000"
  },
  user: {
    user_id: "987fcdeb-51a2-43d1-9f12-345678901234"
  }
}
```

## 🔧 Modifications Apportées

### Fichiers modifiés

1. **`components/initApp.tsx`**
   - ❌ Retiré l'envoi de `company_id` et `user_id` à Guardian
   - ✅ Utilise `/init-db` avec format plat
   - ✅ Simplifié la logique de récupération des IDs

2. **`components/modals/organization-unit-modal.tsx`**
   - ❌ Retiré `company_id` du payload de création/modification
   - ✅ Le backend assigne automatiquement depuis le JWT

3. **`components/modals/position-modal.tsx`**
   - ❌ Retiré `company_id` du payload de création/modification
   - ✅ Le backend assigne automatiquement depuis le JWT

4. **`lib/proxy/mocks.ts`**
   - ✅ Mis à jour les mocks pour refléter les nouvelles structures
   - ✅ Corrigé les types de `company_id` (string au lieu de number)

### Composants non affectés

Les composants suivants **n'ont pas nécessité de modification** car ils n'envoyaient déjà pas `company_id` :

- `components/roles.tsx` - Envoie uniquement `name` et `description`
- `components/policies.tsx` - Envoie uniquement `name` et `description`
- `components/customers.tsx` - Utilise l'import de fichiers
- `components/subcontractors.tsx` - Utilise l'import de fichiers
- `components/admin/UserManagement.tsx` - Gestion des user-roles avec IDs appropriés

## ✅ Checklist de Migration

Pour migrer d'autres composants ou nouveaux développements :

- [ ] Identifier tous les appels `POST`/`PATCH`/`PUT` vers Identity/Guardian
- [ ] Retirer `company_id` et `user_id` des payloads JSON
- [ ] Vérifier que le JWT est correctement passé (via cookies HttpOnly)
- [ ] Mettre à jour les types TypeScript si nécessaire
- [ ] Tester avec MOCK_API=true
- [ ] Tester avec les vrais services backend

## 🔐 Sécurité

### Avantages

1. **Isolation multi-tenant renforcée** : Les utilisateurs ne peuvent plus spécifier un `company_id` arbitraire
2. **Réduction de la surface d'attaque** : Moins de données sensibles dans les payloads
3. **Simplification du code** : Moins de gestion manuelle des IDs côté frontend

### Points d'attention

- Le JWT doit **toujours** être présent et valide
- Les endpoints publics (`/verify_password`, `/health`, etc.) ne sont pas affectés
- L'endpoint `/init-db` nécessite toujours `company_id` et `user_id` (initialisation sans JWT)

## 🧪 Tests

Tous les tests passent avec succès après migration :

```bash
npm test -- --testPathPattern=initApp
npm test -- --testPathPattern=organization-unit
npm test -- --testPathPattern=position
```

Aucune erreur de compilation TypeScript détectée.

## 📖 Références

- [OpenAPI Identity Spec](https://raw.githubusercontent.com/bengeek06/identity-api-waterfall/refs/heads/develop/openapi.yml)
- [OpenAPI Guardian Spec](https://raw.githubusercontent.com/bengeek06/guardian-api-waterfall/refs/heads/develop/openapi.yml)
- [Documentation JWT](./FETCH_WITH_AUTH.md)

## 🚀 Prochaines Étapes

1. Tester avec les services backend réels
2. Vérifier les flows d'initialisation de l'application
3. Valider avec des tests d'intégration end-to-end
4. Merger la branche dans `develop` après validation

---

**Questions ou problèmes ?** Contactez benjamin@waterfall-project.pro
