# Gestion automatique du refresh token

Ce module fournit un wrapper autour de `fetch` qui gère automatiquement le rafraîchissement du token JWT lorsqu'une requête échoue avec un 401.

## Problème résolu

Sans ce système, l'utilisateur était déconnecté régulièrement lorsque le token JWT expirait, nécessitant une nouvelle connexion manuelle.

## Solution

Le module `fetchWithAuth` intercepte automatiquement les erreurs 401 avec le message `"Missing or invalid JWT token"` et :
1. Appelle `/api/auth/refresh` pour obtenir un nouveau token
2. Rejoue la requête originale avec le nouveau token
3. Redirige vers `/login` si le refresh échoue

## Utilisation

### Dans les composants React

```typescript
import { fetchWithAuth } from '@/lib/fetchWithAuth';

// Utilisation identique à fetch standard
const response = await fetchWithAuth('/api/users/123');
const data = await response.json();
```

### Avec parsing JSON automatique

```typescript
import { fetchWithAuthJSON } from '@/lib/fetchWithAuth';

// Parse automatiquement le JSON et lance une erreur si !response.ok
const user = await fetchWithAuthJSON<User>('/api/users/123');
```

### Dans les hooks personnalisés

```typescript
import { fetchWithAuth } from '@/lib/fetchWithAuth';

export function useMyData() {
  useEffect(() => {
    async function loadData() {
      const response = await fetchWithAuth('/api/my-data');
      const data = await response.json();
      setData(data);
    }
    loadData();
  }, []);
}
```

## Fonctionnalités

### Gestion des appels simultanés

Si plusieurs requêtes échouent avec 401 en même temps, un seul refresh est effectué. Les autres requêtes attendent que le refresh se termine avant d'être rejouées.

### Cookies automatiques

Le paramètre `credentials: 'include'` est automatiquement ajouté pour inclure les cookies httpOnly contenant le JWT.

### Détection intelligente

Seules les erreurs 401 avec le message contenant `"JWT token"` déclenchent un refresh. Les autres 401 (ex: permissions insuffisantes) sont retournés normalement.

### Redirection

Si le refresh échoue, l'utilisateur est automatiquement redirigé vers `/login` (sauf s'il est déjà sur la page de login).

## Migration

Pour migrer du code existant utilisant `fetch` :

**Avant :**
```typescript
const response = await fetch('/api/users');
```

**Après :**
```typescript
import { fetchWithAuth } from '@/lib/fetchWithAuth';
const response = await fetchWithAuth('/api/users');
```

C'est tout ! Le reste du code reste identique.

## Tests

Les tests sont disponibles dans `lib/fetchWithAuth.test.ts` et couvrent :
- Requêtes réussies (pas de 401)
- Erreurs 401 sans message JWT (pas de refresh)
- Cycle complet : 401 → refresh → retry réussi
- Inclusion automatique des credentials

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ fetchWithAuth('/api/data')
       v
┌─────────────────────────────┐
│  fetchWithAuth wrapper      │
│  1. Premier appel           │
└──────┬──────────────────────┘
       │
       v
┌─────────────────────────────┐
│  Response 401?              │
│  + "JWT token" message?     │
└──────┬──────────────────────┘
       │ Oui
       v
┌─────────────────────────────┐
│  POST /api/auth/refresh     │
└──────┬──────────────────────┘
       │
       ├─ Success ──> Retry original request
       │
       └─ Fail ──> Redirect to /login
```

## Endpoints requis

### `/api/auth/refresh`

Doit accepter:
- Méthode: `POST`
- Cookies: `access_token` et `refresh_token` (httpOnly)

Doit retourner:
```json
{
  "success": true
}
```

Et définir un nouveau cookie `access_token` dans la réponse.

## Considérations de sécurité

- Les tokens sont stockés dans des cookies httpOnly (inaccessibles en JavaScript)
- Le refresh n'est tenté qu'une seule fois par requête
- La redirection vers login empêche les boucles infinies
- Les credentials sont toujours inclus pour garantir l'envoi des cookies
