# 🔄 Système de Proxy API

Ce dossier contient l'infrastructure de proxy générique qui permet de router les requêtes de Next.js vers les services backend (Auth, Guardian, Identity).

## 📁 Structure

```
lib/proxy/
├── index.ts       # Fonction générique proxyRequest()
├── mocks.ts       # Réponses mock pour le développement
├── types.ts       # Types TypeScript
└── README.md      # Cette documentation
```

## 🚀 Utilisation

### Exemple basique

```typescript
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { authMocks } from "@/lib/proxy/mocks";

export async function POST(req: NextRequest) {
  return proxyRequest(req, {
    service: 'AUTH_SERVICE_URL',
    path: '/login',
    method: 'POST',
    mock: authMocks.login
  });
}
```

### Configuration

La fonction `proxyRequest` accepte un objet `ProxyConfig` :

- **service**: Nom de la variable d'environnement contenant l'URL du service (ex: `'AUTH_SERVICE_URL'`)
- **path**: Chemin de l'endpoint sur le service backend (ex: `'/login'`)
- **method**: Méthode HTTP (`'GET'`, `'POST'`, `'PUT'`, `'DELETE'`, `'PATCH'`)
- **mock**: Objet `MockResponse` retourné quand `MOCK_API=true`

## 🎭 Mode Mock

Lorsque la variable d'environnement `MOCK_API=true`, le système retourne automatiquement les réponses mock définies dans `mocks.ts` sans faire d'appel au backend.

### Ajouter un nouveau mock

Éditez `lib/proxy/mocks.ts` :

```typescript
export const authMocks = {
  nouvelEndpoint: {
    status: 200,
    body: {
      message: "Succès",
      data: { /* ... */ }
    },
    cookies: [
      "token=abc123; Path=/; HttpOnly"
    ]
  } as MockResponse
};
```

## 🔐 Fonctionnalités

### ✅ Gestion automatique des headers
- Filtre automatique du header `host`
- Transmission de tous les autres headers (cookies inclus)
- Support de `credentials: "include"`

### ✅ Gestion automatique des réponses
- Détection automatique JSON vs texte brut
- Transmission des cookies (`Set-Cookie`)
- Préservation du status HTTP

### ✅ Gestion d'erreurs robuste
- Erreurs de connexion (`ECONNREFUSED`) → 503
- Erreurs réseau génériques → 502
- Variable d'environnement manquante → 500
- Logging détaillé via `@/lib/logger`

### ✅ Support du body
- Transmission automatique du body de la requête
- Compatible avec JSON, texte, form-data, etc.

## 📊 Couverture de tests

- **88.67%** de couverture globale
- **100%** de couverture des branches pour les routes
- **92.18%** de couverture pour `lib/proxy/index.ts`

## 🧪 Tests

Chaque endpoint dispose de tests couvrant :

1. **Mode mock** (`MOCK_API=true`)
   - Vérification que fetch n'est pas appelé
   - Vérification de la structure de la réponse mock

2. **Mode proxy** (`MOCK_API=false`)
   - Proxy correct vers le backend
   - Transmission des headers et cookies
   - Gestion des codes HTTP
   - Erreurs de connexion (ECONNREFUSED)
   - Service URL non défini

### Exécuter les tests

```bash
# Tous les tests auth
npm test -- app/api/auth

# Avec couverture
npm test -- --coverage app/api/auth lib/proxy
```

## 📝 Créer une nouvelle route

1. **Créer le mock** dans `lib/proxy/mocks.ts`
2. **Créer la route** `app/api/[service]/[endpoint]/route.ts` :

```typescript
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { authMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'AUTH_SERVICE_URL',
    path: '/endpoint',
    method: 'GET',
    mock: authMocks.endpoint
  });
}
```

3. **Créer les tests** `app/api/[service]/[endpoint]/route.test.ts` (voir exemples existants)

## 🌐 Services supportés

- **AUTH_SERVICE_URL**: Service d'authentification
- **GUARDIAN_SERVICE_URL**: Service de gestion des permissions/rôles
- **IDENTITY_SERVICE_URL**: Service de gestion des utilisateurs/entreprises

## 🔧 Variables d'environnement

```env
# Backend services
AUTH_SERVICE_URL=http://localhost:5001
GUARDIAN_SERVICE_URL=http://localhost:5002
IDENTITY_SERVICE_URL=http://localhost:5003

# Mode mock (pour développement sans backend)
MOCK_API=true
```

## 📖 Spécification OpenAPI

La spécification complète de l'API Auth est disponible dans `.spec/openapi.yml`.

## 🎯 Avantages

1. **Code minimal** : Routes en 2-3 lignes
2. **DRY** : Zéro duplication de code
3. **Maintenable** : Modifications centralisées
4. **Testable** : Mocks centralisés et réutilisables
5. **Type-safe** : Types TypeScript complets
6. **Observable** : Logging détaillé via logger
