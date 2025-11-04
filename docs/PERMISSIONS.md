# Système de Permissions

Ce document décrit le système de permissions basé sur les rôles (RBAC) implémenté dans l'application Waterfall.

## Vue d'ensemble

Le système de permissions permet de contrôler l'affichage des composants UI en fonction des droits de l'utilisateur. Il utilise une approche flexible avec des combinaisons de permissions AND/OR.

## Architecture

### Fichiers principaux

- **`lib/permissions.ts`** : Types, constantes et utilitaires de base
- **`lib/hooks/usePermissions.ts`** : Hook React pour gérer l'état des permissions utilisateur
- **`lib/hooks/useAvailablePermissions.ts`** : Hook React pour charger toutes les permissions disponibles
- **`components/ProtectedCard.tsx`** : Composant wrapper pour protéger les éléments UI
- **`components/policies.tsx`** : Composant d'administration des policies et permissions
- **`app/api/guardian/permissions/route.ts`** : Endpoint API pour récupérer toutes les permissions du système
- **`app/api/identity/users/[user_id]/permissions/route.ts`** : Endpoint API pour récupérer les permissions d'un utilisateur spécifique

## Concepts clés

### Permission

Une permission unique est définie par :
```typescript
interface Permission {
  service: string;   // "identity", "guardian", etc.
  resource: string;  // "users", "roles", "companies", etc.
  action: string;    // "list", "create", "read", "update", "delete"
}
```

### Logique AND/OR

Le système permet de définir des conditions complexes :

- **PermissionAndGroup** : Tableau de conditions liées par AND (toutes doivent être satisfaites)
- **PermissionRequirements** : Tableau de groupes AND liés par OR (au moins un groupe doit être satisfait)

**Exemple :**
```typescript
// (users:list AND roles:list) OR (companies:read)
const requirements = [
  [
    { service: "identity", resource: "users", action: "list" },
    { service: "guardian", resource: "roles", action: "list" }
  ],
  [
    { service: "identity", resource: "companies", action: "read" }
  ]
];
```

## Utilisation

### 1. Charger les permissions disponibles dynamiquement (recommandé)

Les permissions sont gérées par le service Guardian et peuvent être chargées dynamiquement :

```tsx
import { useAvailablePermissions } from "@/lib/hooks";
import { createPermissionConstants } from "@/lib/permissions";

function MyComponent() {
  const { availablePermissions, loading, error } = useAvailablePermissions();
  
  // Créer des constantes dynamiques
  const DYNAMIC_PERMS = createPermissionConstants(availablePermissions);
  
  // Utiliser: DYNAMIC_PERMS.IDENTITY_USERS_LIST
}
```

### 2. Utiliser les constantes prédéfinies (pour référence)

Des permissions courantes sont disponibles dans `PERMISSIONS` pour le typage et les tests :

```typescript
import { PERMISSIONS } from "@/lib/permissions";

// Exemples de permissions
PERMISSIONS.IDENTITY_USERS_LIST        // { service: "identity", resource: "users", action: "list" }
PERMISSIONS.GUARDIAN_ROLES_LIST        // { service: "guardian", resource: "roles", action: "list" }
PERMISSIONS.IDENTITY_COMPANIES_READ    // { service: "identity", resource: "companies", action: "read" }
PERMISSIONS.IDENTITY_COMPANIES_UPDATE  // { service: "identity", resource: "companies", action: "update" }
```

> ⚠️ **Note**: Les constantes `PERMISSIONS` sont utiles pour le développement et les tests, mais en production, les permissions réelles proviennent du service Guardian via `/api/guardian/permissions`.

### 2. Utiliser les presets de requirements

Des combinaisons courantes sont prédéfinies dans `PERMISSION_REQUIREMENTS` :

```typescript
import { PERMISSION_REQUIREMENTS } from "@/lib/permissions";

// USER_ADMINISTRATION : Nécessite users:list ET roles:list
PERMISSION_REQUIREMENTS.USER_ADMINISTRATION

// COMPANY_SETTINGS : Nécessite companies:read OU companies:update
PERMISSION_REQUIREMENTS.COMPANY_SETTINGS
```

### 3. Protéger un composant avec ProtectedCard

Le composant `ProtectedCard` enveloppe du contenu et le rend visible uniquement si les permissions sont satisfaites :

```tsx
import { ProtectedCard } from "@/components/ProtectedCard";
import { PERMISSION_REQUIREMENTS } from "@/lib/permissions";

export function MyComponent() {
  return (
    <ProtectedCard requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}>
      <Card>
        <CardHeader>
          <CardTitle>Administration des utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Contenu visible uniquement si l'utilisateur a les permissions */}
        </CardContent>
      </Card>
    </ProtectedCard>
  );
}
```

### 4. Props de ProtectedCard

#### `requirements` (requis)
Type : `PermissionRequirements`

Définit les permissions nécessaires pour afficher le contenu.

#### `loadingBehavior` (optionnel)
Type : `'hide' | 'show' | 'skeleton'`  
Défaut : `'show'`

Contrôle l'affichage pendant le chargement des permissions :
- `'hide'` : Masque le contenu pendant le chargement
- `'show'` : Affiche le contenu pendant le chargement
- `'skeleton'` : Affiche un skeleton loader

```tsx
<ProtectedCard 
  requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
  loadingBehavior="hide"
>
  <Card>...</Card>
</ProtectedCard>
```

#### `fallback` (optionnel)
Type : `ReactNode`  
Défaut : `null`

Contenu à afficher si les permissions ne sont pas satisfaites :

```tsx
<ProtectedCard 
  requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
  fallback={<div className="text-muted-foreground">Accès non autorisé</div>}
>
  <Card>...</Card>
</ProtectedCard>
```

### 5. Utiliser le hook usePermissions

Pour des besoins plus avancés, utilisez directement le hook :

```tsx
import { usePermissions } from "@/lib/hooks/usePermissions";
import { PERMISSION_REQUIREMENTS } from "@/lib/permissions";

export function MyComponent() {
  const { permissions, loading, error, hasPermission } = usePermissions();
  
  const canManageUsers = hasPermission(PERMISSION_REQUIREMENTS.USER_ADMINISTRATION);
  const canManageCompany = hasPermission(PERMISSION_REQUIREMENTS.COMPANY_SETTINGS);
  
  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error.message}</div>;
  
  return (
    <div>
      {canManageUsers && <UserManagementPanel />}
      {canManageCompany && <CompanySettingsPanel />}
    </div>
  );
}
```

### 6. Créer des requirements personnalisés

Pour des cas spécifiques, créez vos propres requirements :

```tsx
// Nécessite la permission de lire ET mettre à jour les projets
const projectEditRequirements = [
  [
    { service: "project", resource: "projects", action: "read" },
    { service: "project", resource: "projects", action: "update" }
  ]
];

<ProtectedCard requirements={projectEditRequirements}>
  <ProjectEditor />
</ProtectedCard>
```

```tsx
// Nécessite SOIT admin général SOIT admin de projet
const projectAdminRequirements = [
  [{ service: "guardian", resource: "admin", action: "all" }],
  [{ service: "project", resource: "admin", action: "manage" }]
];

<ProtectedCard requirements={projectAdminRequirements}>
  <AdminPanel />
</ProtectedCard>
```

## API Backend

### Endpoint : GET /api/guardian/permissions

Récupère **toutes les permissions disponibles** dans le système (définies par Guardian).

**Headers requis :**
- Cookies : `accessToken`

**Réponse :**
```json
{
  "permissions": [
    {
      "service": "identity",
      "resource": "users",
      "action": "list"
    },
    {
      "service": "identity",
      "resource": "users",
      "action": "create"
    },
    {
      "service": "guardian",
      "resource": "roles",
      "action": "list"
    }
  ]
}
```

**Codes de statut :**
- `200` : Succès
- `401` : Non authentifié
- `500` : Erreur serveur

---

### Endpoint : GET /api/auth/me/permissions

Récupère **les permissions de l'utilisateur connecté** (recommandé pour les composants client).

**Authentification :**
- Cookie httpOnly : `access_token` (lu automatiquement côté serveur)

**Réponse :**
```json
[
  {
    "id": "1",
    "service": "identity",
    "resource_name": "users",
    "operation": "LIST",
    "description": "List all users"
  },
  {
    "id": "2",
    "service": "guardian",
    "resource_name": "roles",
    "operation": "LIST",
    "description": "List all roles"
  }
]
```

**Codes de statut :**
- `200` : Succès
- `401` : Non authentifié ou token invalide
- `500` : Erreur serveur

**Avantages :**
- ✅ Fonctionne avec les cookies httpOnly
- ✅ Pas besoin de passer le user_id
- ✅ Idéal pour les hooks côté client

---

### Endpoint : GET /api/identity/users/{user_id}/permissions

Récupère **les permissions d'un utilisateur spécifique** (pour l'administration).

**Headers requis :**
- Cookies : `access_token`

**Paramètres :**
- `user_id` : ID de l'utilisateur à interroger

**Réponse :**
```json
[
  {
    "id": "1",
    "service": "identity",
    "resource_name": "users",
    "operation": "LIST",
    "description": "List all users"
  }
]
```

**Codes de statut :**
- `200` : Succès
- `401` : Non authentifié
- `404` : Utilisateur non trouvé
- `500` : Erreur serveur

**Note** : Cet endpoint agrège automatiquement toutes les permissions de l'utilisateur en :
1. Récupérant tous ses rôles depuis Guardian
2. Pour chaque rôle, récupérant les policies associées
3. Pour chaque policy, récupérant les permissions associées
4. Retournant une liste dédupliquée

**Utilisation :** Privilégier `/api/auth/me/permissions` pour l'utilisateur connecté

## Tests

### Tester les utilitaires de permissions

```typescript
import { checkPermissions, PERMISSION_REQUIREMENTS } from "@/lib/permissions";

const userPermissions = [
  { service: "identity", resource: "users", action: "list" },
  { service: "guardian", resource: "roles", action: "list" }
];

const hasAccess = checkPermissions(
  userPermissions, 
  PERMISSION_REQUIREMENTS.USER_ADMINISTRATION
);
// hasAccess === true
```

### Tester le composant ProtectedCard

```typescript
import { render, screen } from "@testing-library/react";
import { ProtectedCard } from "@/components/ProtectedCard";
import { usePermissions } from "@/lib/hooks/usePermissions";

jest.mock("@/lib/hooks/usePermissions");

test("shows content when permissions are satisfied", () => {
  (usePermissions as jest.Mock).mockReturnValue({
    permissions: [...],
    loading: false,
    error: null,
    hasPermission: () => true
  });
  
  render(
    <ProtectedCard requirements={[...]}>
      <div>Protected Content</div>
    </ProtectedCard>
  );
  
  expect(screen.getByText("Protected Content")).toBeInTheDocument();
});
```

## Afficher toutes les permissions disponibles (Administrateurs)

Le composant `policies.tsx` existant permet déjà aux administrateurs de :
- Visualiser toutes les permissions du système (chargées depuis `/api/guardian/permissions`)
- Gérer les policies (créer, éditer, supprimer)
- Associer/dissocier des permissions aux policies
- Grouper l'affichage par service et ressource

Ce composant est accessible via la page d'administration et couvre tous les besoins de gestion des permissions.

## Bonnes pratiques

### 1. Utiliser les constantes ou charger dynamiquement

❌ **Éviter les hardcoded permissions :**
```tsx
<ProtectedCard requirements={[[
  { service: "identity", resource: "users", action: "list" }
]]}>
```

✅ **Préférer les constantes prédéfinies :**
```tsx
<ProtectedCard requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}>
```

✅ **Ou charger dynamiquement :**
```tsx
const { availablePermissions } = useAvailablePermissions();
const usersPerm = findPermission(availablePermissions, "identity", "users", "list");
```

### 2. Grouper les permissions liées

Pour une meilleure maintenabilité, définissez des requirements réutilisables :

```typescript
// lib/permissions.ts
export const PERMISSION_REQUIREMENTS = {
  USER_ADMINISTRATION: [[
    PERMISSIONS.IDENTITY_USERS_LIST,
    PERMISSIONS.GUARDIAN_ROLES_LIST
  ]],
  COMPANY_SETTINGS: [
    [PERMISSIONS.IDENTITY_COMPANIES_READ],
    [PERMISSIONS.IDENTITY_COMPANIES_UPDATE]
  ],
  // Ajoutez vos propres presets ici
  PROJECT_MANAGEMENT: [[
    PERMISSIONS.PROJECT_PROJECTS_LIST,
    PERMISSIONS.PROJECT_PROJECTS_CREATE
  ]]
} as const;
```

### 3. Utiliser loadingBehavior approprié

- `'hide'` : Pour les cartes facultatives (ex: options avancées)
- `'show'` : Pour le contenu principal (évite le flash)
- `'skeleton'` : Pour les sections importantes avec temps de chargement visible

### 4. Fournir un fallback informatif

Pour une meilleure UX, indiquez pourquoi le contenu n'est pas accessible :

```tsx
<ProtectedCard 
  requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
  fallback={
    <Card className="border-dashed">
      <CardContent className="text-center py-8 text-muted-foreground">
        <ShieldX className="mx-auto mb-2" />
        <p>Vous n'avez pas accès à cette fonctionnalité</p>
      </CardContent>
    </Card>
  }
>
  <AdminPanel />
</ProtectedCard>
```

## Exemple complet : Page d'accueil

```tsx
// app/home/page.tsx
import { HomeCards } from "@/components/HomeCards";

export default async function HomePage() {
  return (
    <div className="container">
      <h1>Bienvenue</h1>
      <HomeCards />
    </div>
  );
}

// components/HomeCards.tsx
"use client";

import { ProtectedCard } from "@/components/ProtectedCard";
import { PERMISSION_REQUIREMENTS } from "@/lib/permissions";

export function HomeCards() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Visible uniquement avec permissions users:list ET roles:list */}
      <ProtectedCard 
        requirements={PERMISSION_REQUIREMENTS.USER_ADMINISTRATION}
        loadingBehavior="hide"
      >
        <Card>
          <CardHeader>
            <CardTitle>Administration des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/admin">
              <Button>Accéder</Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Visible avec companies:read OU companies:update */}
      <ProtectedCard 
        requirements={PERMISSION_REQUIREMENTS.COMPANY_SETTINGS}
        loadingBehavior="hide"
      >
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de l'entreprise</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/home/company">
              <Button>Accéder</Button>
            </Link>
          </CardContent>
        </Card>
      </ProtectedCard>

      {/* Toujours visible */}
      <Card>
        <CardHeader>
          <CardTitle>Projets</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/home/projects">
            <Button>Accéder</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Dépannage

### Les permissions ne se chargent pas

1. Vérifier que l'utilisateur est authentifié (cookies `accessToken` et `user_id`)
2. Vérifier les logs du serveur Guardian
3. Vérifier la console browser pour les erreurs réseau

### Le contenu ne s'affiche pas malgré les bonnes permissions

1. Vérifier que la structure des permissions correspond exactement
2. Utiliser `console.log(permissions)` dans le composant
3. Tester avec `checkPermissions()` dans la console

### Les tests échouent

1. S'assurer que `usePermissions` est mocké correctement
2. Vérifier que `hasPermission` retourne la bonne valeur
3. Utiliser `waitFor` pour les opérations asynchrones

## Utilitaires avancés

### getPermissionKey()
Génère une clé unique pour une permission :
```typescript
import { getPermissionKey } from "@/lib/permissions";

const perm = { service: "identity", resource: "users", action: "list" };
const key = getPermissionKey(perm); // "identity.users.list"
```

### findPermission()
Recherche une permission spécifique dans une liste :
```typescript
import { findPermission } from "@/lib/permissions";

const { availablePermissions } = useAvailablePermissions();
const userListPerm = findPermission(availablePermissions, "identity", "users", "list");
```

### createPermissionConstants()
Crée des constantes depuis une liste dynamique :
```typescript
import { createPermissionConstants } from "@/lib/permissions";

const { availablePermissions } = useAvailablePermissions();
const PERMS = createPermissionConstants(availablePermissions);

// Utilisation
const requirement = [[PERMS.IDENTITY_USERS_LIST, PERMS.GUARDIAN_ROLES_LIST]];
```

## Note sur l'architecture

### Réutilisation de l'existant

Le système utilise les routes et composants existants au lieu de créer des duplicatas :

- **Permissions utilisateur** : Utilise `/api/identity/users/{user_id}/permissions` (existant et testé)
- **Liste des permissions** : Le composant `policies.tsx` affiche déjà toutes les permissions et permet leur gestion complète
- **Pas de routes redondantes** : Évite la duplication de logique

### Principe DRY (Don't Repeat Yourself)

Avant de créer un nouveau endpoint ou composant, vérifiez si la fonctionnalité n'existe pas déjà dans :
- Les routes API existantes (`app/api/`)
- Les composants existants (`components/`)
- Les hooks existants (`lib/hooks/`)

## Évolution future

### TODO
- [ ] Implémenter un vrai skeleton loader (actuellement placeholder)
- [ ] Ajouter un système de cache pour les permissions disponibles
- [ ] Supporter les wildcards dans les permissions (ex: `action: "*"`)
- [ ] Ajouter des permissions pour les ressources Project
- [ ] Créer un composant ProtectedRoute pour Next.js
- [ ] Ajouter des analytics sur l'utilisation des permissions
- [ ] Synchroniser automatiquement PERMISSIONS avec Guardian au build

## Ressources

- [Guardian API Spec](/.spec/guardian_api.yml)
- [Tests unitaires](/lib/permissions.test.ts)
- [Tests de composant](/components/ProtectedCard.test.tsx)
