# 🎭 Guide d'utilisation du mode Mock

## Pourquoi utiliser le mode mock ?

Le mode mock permet de développer et tester le frontend **sans avoir besoin du backend**. C'est idéal pour :
- 🚀 Développement frontend indépendant
- 🧪 Tests d'intégration sans dépendances externes
- 🎨 Prototypage rapide
- 📱 Démos sans infrastructure complète

## Configuration

### Activer le mode mock

Ajoutez dans votre fichier `.env.local` :

```env
MOCK_API=true
```

### Désactiver le mode mock (utiliser le vrai backend)

```env
MOCK_API=false
AUTH_SERVICE_URL=http://localhost:5001
```

## Comportement

Lorsque `MOCK_API=true` :
- ✅ Aucun appel réseau n'est effectué
- ✅ Les réponses sont instantanées
- ✅ Les données sont cohérentes et prévisibles
- ✅ Les cookies sont correctement simulés
- ⚠️ Les logs indiquent "Mocking [service] response"

## Mocks disponibles

### Authentication Service

Tous les mocks sont définis dans `lib/proxy/mocks.ts` :

#### 1. Login (`POST /api/auth/login`)
```json
{
  "message": "Login successful",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "mock-refresh-token-a1B2c3D4e5F6g7H8i9J0",
  "_dev_note": "Tokens visible in development mode only"
}
```
**Cookies définis** : `access_token`, `refresh_token`

#### 2. Verify (`GET /api/auth/verify`)
```json
{
  "valid": true,
  "user_id": "mock-user-id",
  "email": "mock@test.com",
  "company_id": "mock-company-id"
}
```

#### 3. Refresh (`POST /api/auth/refresh`)
```json
{
  "message": "Token refreshed",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "new-mock-refresh-token-b2C3d4E5f6G7h8I9j0K1",
  "_dev_note": "Tokens visible in development mode only"
}
```
**Cookies définis** : nouveaux `access_token`, `refresh_token`

#### 4. Logout (`POST /api/auth/logout`)
```json
{
  "message": "Logout successful"
}
```
**Cookies effacés** : `access_token`, `refresh_token` (Max-Age=0)

#### 5. Health (`GET /api/auth/health`)
```json
{
  "status": "healthy",
  "service": "authentication",
  "message": "Authentication service is running (mock)"
}
```

#### 6. Version (`GET /api/auth/version`)
```json
{
  "version": "0.0.1-mock"
}
```

#### 7. Config (`GET /api/auth/config`)
```json
{
  "FLASK_ENV": "development",
  "DATABASE_URL": "postgresql://mock:mock@localhost:5432/mock",
  "LOG_LEVEL": "INFO",
  "USER_SERVICE_URL": "http://mock-user-service:5002"
}
```

## Exemple d'utilisation frontend

```typescript
// Dans un composant React
const handleLogin = async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123'
    })
  });
  
  const data = await response.json();
  // En mode mock, retourne instantanément la réponse mock
  console.log(data.message); // "Login successful"
};
```

## Personnaliser les mocks

### Modifier un mock existant

Éditez `lib/proxy/mocks.ts` :

```typescript
export const authMocks = {
  login: {
    status: 200,
    body: {
      message: "Bienvenue !",  // ✏️ Personnalisez le message
      access_token: "votre-token-custom",
      // ...
    },
    cookies: [
      "access_token=custom-token; Path=/; HttpOnly"
    ]
  } as MockResponse
};
```

### Ajouter un nouveau mock

```typescript
export const authMocks = {
  // ... mocks existants ...
  
  nouveauEndpoint: {
    status: 200,
    body: {
      message: "Succès",
      data: { /* vos données */ }
    },
    cookies: ["optional-cookie=value; Path=/"]
  } as MockResponse
};
```

### Simuler une erreur

```typescript
export const authMocks = {
  login: {
    status: 401,  // ❌ Code d'erreur
    body: {
      message: "Invalid credentials"
    }
  } as MockResponse
};
```

## Tester avec les mocks

```bash
# Activer le mode mock
export MOCK_API=true

# Lancer les tests
npm test -- app/api/auth

# Les tests vérifient automatiquement que :
# - fetch n'est pas appelé en mode mock
# - les réponses correspondent aux mocks définis
```

## Bonnes pratiques

### ✅ À faire
- Utiliser le mode mock pour le développement frontend
- Garder les mocks cohérents avec la spécification OpenAPI
- Tester régulièrement avec le vrai backend
- Documenter les changements de mocks

### ❌ À éviter
- Commiter `MOCK_API=true` en production
- Diverger significativement entre mocks et vraies données
- Oublier de tester avec le backend réel
- Inclure des données sensibles dans les mocks

## Debugging

### Vérifier si le mode mock est actif

Regardez les logs de la console :

```
⚠️  Mocking AUTH_SERVICE response for /login
```

### Forcer l'utilisation du backend

```bash
# Temporairement
MOCK_API=false npm run dev

# Ou dans .env.local
MOCK_API=false
AUTH_SERVICE_URL=http://localhost:5001
```

## Workflow recommandé

1. **Développement initial** : `MOCK_API=true`
   - Pas besoin du backend
   - Développement rapide

2. **Tests d'intégration** : `MOCK_API=false`
   - Validation avec le vrai backend
   - Détection d'incohérences

3. **Production** : `MOCK_API=false`
   - Toujours connecté au backend réel

## Prochains services

Les mocks pour Guardian et Identity suivront le même pattern :

```typescript
// lib/proxy/mocks.ts
export const guardianMocks = { /* ... */ };
export const identityMocks = { /* ... */ };
```

---

💡 **Astuce** : En mode mock, le frontend fonctionne **même si aucun backend n'est démarré** !
