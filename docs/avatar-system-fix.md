# Avatar System Fix - Issue #25

## Problème identifié

Le système d'avatar présentait une **non-conformité avec la spécification OpenAPI** de Identity Service :

### Frontend (avant)
- Utilisait le champ `avatar_url` (inexistant dans la spec)
- Tentait de charger les avatars depuis `/api/identity/users/{id}/avatar` (endpoint non documenté)
- Résultat : **404 Not Found** dans la console

### Spec OpenAPI Identity
```yaml
User:
  properties:
    has_avatar:
      type: boolean
      description: "Indique si l'utilisateur possède un avatar"
    avatar_file_id:
      type: string
      format: uuid
      nullable: true
      description: "ID du fichier avatar dans le Storage Service"
```

**Constat** : La spec ne définit PAS d'endpoint `/users/{id}/avatar`. Elle utilise :
- `has_avatar` : booléen pour savoir si l'utilisateur a un avatar
- `avatar_file_id` : UUID référençant le fichier dans le Storage Service

## Corrections appliquées

### 1. Schémas de validation (`lib/validation/identity.schemas.ts`)
✅ Remplacé `avatar_url` par `has_avatar` et `avatar_file_id` dans :
- `createUserSchema`
- `updateUserSchema`
- `profileUpdateSchema`

### 2. Mocks (`lib/proxy/mocks.ts`)
✅ Mis à jour tous les mocks de users :
```typescript
// Avant
avatar_url: "https://example.com/avatar.jpg"

// Après
has_avatar: true,
avatar_file_id: "00000000-0000-0000-0000-000000000001"
```

### 3. Composant AvatarImage (`components/AvatarImage.tsx`)
✅ Ajout du prop `hasAvatar` :
```typescript
interface AvatarImageProps {
  userId: string;
  hasAvatar?: boolean;  // 👈 NOUVEAU
  size?: number;
  // ...
}

// Si !hasAvatar, afficher icône User directement sans tenter de charger
if (!hasAvatar || hasError) {
  return <User .../>;
}
```

### 4. Fonction utilitaire (`lib/user.ts`)
✅ Remplacé `getAvatarUrl()` par `hasUserAvatar()` :
```typescript
// Avant : retournait user.avatar_url (inexistant)
export async function getAvatarUrl(): Promise<string | null>

// Après : retourne user.has_avatar (conforme spec)
export async function hasUserAvatar(): Promise<boolean>
```

### 5. Composants utilisateurs
✅ **TopBar.tsx** : Passe `hasAvatar={userData?.has_avatar}` à AvatarImage
✅ **UserDataTable.tsx** : 
- Type `User` mis à jour avec `has_avatar` et `avatar_file_id`
- Passe `hasAvatar={row.original.has_avatar}` à AvatarImage

✅ **UserFormModal.tsx** :
- Type `User` mis à jour
- Upload d'avatar via FormData (champ "avatar") → backend gère `has_avatar` automatiquement
- Preview affichée uniquement si `user.has_avatar === true`

✅ **profile.tsx** :
- Type `User` mis à jour
- Preview initialisée avec endpoint SI `user.has_avatar === true`

### 6. Tests
✅ **TopBar.test.tsx** : Mock `hasUserAvatar` au lieu de `getAvatarUrl`
✅ **profile.test.tsx** : Mock user avec `has_avatar` et `avatar_file_id`

## Ce qui reste à faire

### Option 1 : Backend ajoute l'endpoint (RECOMMANDÉ)
Le backend Identity devrait implémenter `GET /users/{id}/avatar` pour simplifier le frontend :

```yaml
/users/{id}/avatar:
  get:
    summary: Récupère l'avatar d'un utilisateur
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        description: Image de l'avatar
        content:
          image/*:
            schema:
              type: string
              format: binary
      404:
        description: Avatar non trouvé
```

**Avantages** :
- Frontend simple : `<Image src="/api/identity/users/{id}/avatar" />`
- Abstraction du Storage Service (le backend gère la récupération via `avatar_file_id`)
- Conforme aux bonnes pratiques REST

### Option 2 : Frontend utilise Storage Service directement
Alternative : le frontend construit l'URL du Storage Service :

```typescript
const avatarUrl = user.avatar_file_id 
  ? `/api/storage/files/${user.avatar_file_id}`
  : null;
```

**Inconvénients** :
- Couplage fort frontend ↔ Storage Service
- Logique de récupération dupliquée
- Gestion des permissions plus complexe

## Résultat actuel

✅ **Plus de 404** : AvatarImage vérifie `hasAvatar` AVANT de charger l'image
✅ **Conformité spec** : Tous les types utilisent `has_avatar` + `avatar_file_id`
✅ **Tests passent** : TopBar et Profile tests validés

⚠️ **Limitation temporaire** : Les avatars ne s'affichent PAS (icône User en fallback) car :
- Frontend attend endpoint `/users/{id}/avatar`
- Endpoint n'existe pas dans la spec/implémentation actuelle
- Solution temporaire : afficher l'icône User (pas de 404)

## Recommandation

**Implémenter `GET /users/{id}/avatar` dans Identity Service** conformément à l'Option 1 ci-dessus. Cet endpoint devrait :

1. Récupérer `user.avatar_file_id` depuis la DB
2. Si NULL ou `has_avatar=false` → 404
3. Sinon, proxy vers Storage Service `/files/{avatar_file_id}`
4. Retourner l'image avec les bons headers (Content-Type, Cache-Control)

Cela permettra au frontend de fonctionner sans modification supplémentaire.
