# 🔄 Guide de migration Guardian & Identity vers le nouveau système de proxy

## 📋 Checklist de migration

### Étape 1 : Préparer les mocks

Créer/compléter les sections dans `lib/proxy/mocks.ts` :

```typescript
/**
 * Guardian service mocks
 */
export const guardianMocks = {
  health: {
    status: 200,
    body: {
      status: "healthy",
      service: "guardian",
      message: "Guardian service is running (mock)"
    }
  } as MockResponse,
  
  version: {
    status: 200,
    body: {
      version: "0.0.1-mock"
    }
  } as MockResponse,
  
  permissions: {
    status: 200,
    body: {
      permissions: [
        { id: "1", name: "read:users", description: "Read users" },
        { id: "2", name: "write:users", description: "Write users" }
      ]
    }
  } as MockResponse,
  
  roles: {
    status: 200,
    body: {
      roles: [
        { id: "1", name: "admin", permissions: ["read:users", "write:users"] },
        { id: "2", name: "user", permissions: ["read:users"] }
      ]
    }
  } as MockResponse,
  
  // etc.
};

/**
 * Identity service mocks
 */
export const identityMocks = {
  health: {
    status: 200,
    body: {
      status: "healthy",
      service: "identity",
      message: "Identity service is running (mock)"
    }
  } as MockResponse,
  
  version: {
    status: 200,
    body: {
      version: "0.0.1-mock"
    }
  } as MockResponse,
  
  users: {
    status: 200,
    body: {
      users: [
        { id: "1", email: "admin@test.com", name: "Admin User" },
        { id: "2", email: "user@test.com", name: "Regular User" }
      ]
    }
  } as MockResponse,
  
  companies: {
    status: 200,
    body: {
      companies: [
        { id: "1", name: "Acme Corp", domain: "acme.com" }
      ]
    }
  } as MockResponse,
  
  // etc.
};
```

### Étape 2 : Migrer les routes existantes

#### Exemple Guardian Health

**Avant** (`app/api/guardian/health/route.ts`) :
```typescript
import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";

const GUARDIAN_SERVICE_URL = process.env.GUARDIAN_SERVICE_URL;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  logger.info("GET request to /api/guardian/health");
  
  if (process.env.MOCK_API === 'true') {
    logger.warn("Mocking guardian service response");
    return NextResponse.json({ 
      status: "healthy", 
      service: "guardian" 
    });
  }
  
  // ... 60+ lignes de code de proxy ...
}
```

**Après** :
```typescript
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { guardianMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyRequest(req, {
    service: 'GUARDIAN_SERVICE_URL',
    path: '/health',
    method: 'GET',
    mock: guardianMocks.health
  });
}
```

### Étape 3 : Créer les tests

Copier et adapter depuis `app/api/auth/health/route.test.ts` :

```typescript
/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

jest.mock("@/lib/logger", () => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}));

describe("GET /api/guardian/health", () => {
  const GUARDIAN_SERVICE_URL = "http://guardian_service:5002";
  let req: NextRequest;
  let mockFetch: jest.Mock;
  let GETFn: (req: NextRequest) => Promise<Response>;

  const buildReq = () => {
    return {
      text: jest.fn().mockResolvedValue(""),
      url: "http://localhost:3000/api/guardian/health",
      headers: {
        entries: jest.fn().mockReturnValue([]),
        // ... autres méthodes
      },
    };
  };

  describe("MOCK_API=true", () => {
    beforeEach(async () => {
      jest.resetModules();
      process.env.GUARDIAN_SERVICE_URL = "";
      process.env.MOCK_API = "true";
      ({ GET: GETFn } = await import("./route"));
      // @ts-expect-error: mock request
      req = buildReq();
      mockFetch = jest.fn();
      global.fetch = mockFetch as unknown as typeof fetch;
    });

    it("retourne la réponse mock", async () => {
      const res = await GETFn(req as unknown as NextRequest);
      expect(mockFetch).not.toHaveBeenCalled();
      const json = await res.json();
      expect(json).toMatchObject({
        status: expect.any(String),
        service: "guardian",
      });
    });
  });

  describe("MOCK_API=false", () => {
    // ... tests similaires à auth
  });
});
```

## 🎯 Routes à migrer

### Guardian Service (`/api/guardian/`)

- [x] `/health` - GET - Health check
- [x] `/version` - GET - Version info
- [ ] `/init-app` - POST - Initialize application
- [ ] `/permissions` - GET - List permissions
- [ ] `/permissions` - POST - Create permission
- [ ] `/permissions/:id` - GET - Get permission
- [ ] `/permissions/:id` - PUT - Update permission
- [ ] `/permissions/:id` - DELETE - Delete permission
- [ ] `/roles` - GET - List roles
- [ ] `/roles` - POST - Create role
- [ ] `/roles/:id` - GET - Get role
- [ ] `/roles/:id` - PUT - Update role
- [ ] `/roles/:id` - DELETE - Delete role
- [ ] `/policies` - GET - List policies
- [ ] `/policies/:id` - GET - Get policy
- [ ] `/users-roles` - GET - List user-role mappings

### Identity Service (`/api/identity/`)

- [x] `/health` - GET - Health check
- [x] `/version` - GET - Version info
- [ ] `/init-app` - POST - Initialize application
- [ ] `/users` - GET - List users
- [ ] `/users` - POST - Create user
- [ ] `/users/:id` - GET - Get user
- [ ] `/users/:id` - PUT - Update user
- [ ] `/users/:id` - DELETE - Delete user
- [ ] `/companies` - GET - List companies
- [ ] `/companies` - POST - Create company
- [ ] `/companies/:id` - GET - Get company
- [ ] `/companies/:id` - PUT - Update company
- [ ] `/companies/:id` - DELETE - Delete company

## 📝 Pattern pour routes avec paramètres

Pour les routes avec paramètres dynamiques (ex: `/users/:id`) :

```typescript
// app/api/identity/users/[user_id]/route.ts
import { NextRequest } from "next/server";
import { proxyRequest } from "@/lib/proxy";
import { identityMocks } from "@/lib/proxy/mocks";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${params.user_id}`,
    method: 'GET',
    mock: identityMocks.userById
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${params.user_id}`,
    method: 'PUT',
    mock: identityMocks.userUpdate
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { user_id: string } }
) {
  return proxyRequest(req, {
    service: 'IDENTITY_SERVICE_URL',
    path: `/users/${params.user_id}`,
    method: 'DELETE',
    mock: identityMocks.userDelete
  });
}
```

## 🔧 Variables d'environnement

Ajouter dans `.env.local` :

```env
# Services backend
AUTH_SERVICE_URL=http://localhost:5001
GUARDIAN_SERVICE_URL=http://localhost:5002
IDENTITY_SERVICE_URL=http://localhost:5003

# Mode mock
MOCK_API=true
```

## 🧪 Script de test automatisé

```bash
#!/bin/bash
# test-all-services.sh

echo "🧪 Testing Auth service..."
npm test -- app/api/auth

echo "🧪 Testing Guardian service..."
npm test -- app/api/guardian

echo "🧪 Testing Identity service..."
npm test -- app/api/identity

echo "📊 Generating coverage report..."
npm test -- --coverage --collectCoverageFrom='app/api/**/route.ts' --collectCoverageFrom='lib/proxy/**/*.ts' app/api lib/proxy
```

## 📊 Estimation temps de migration

Pour un service avec 10 endpoints :

- **Mocks** : ~30 min
- **Routes** : ~5 min par endpoint = ~50 min
- **Tests** : ~10 min par endpoint = ~100 min
- **Total** : ~3h par service

Avec Auth déjà fait comme template, Guardian et Identity devraient prendre ~6h total.

## ✅ Validation

Après migration, vérifier :

1. ✅ Tous les tests passent
2. ✅ Couverture > 85%
3. ✅ Aucune erreur ESLint
4. ✅ Mode mock fonctionne
5. ✅ Mode proxy fonctionne avec backend réel
6. ✅ Les cookies sont correctement transmis
7. ✅ Les erreurs sont bien gérées

## 🎓 Ressources

- Exemple complet : `app/api/auth/login/`
- Documentation proxy : `lib/proxy/README.md`
- Guide mock : `docs/MOCK_MODE_GUIDE.md`
- Spécification OpenAPI : `.spec/openapi.yml`

---

🚀 **Bon courage pour la migration !** Suivez le pattern établi et tout ira bien.
