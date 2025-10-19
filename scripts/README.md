# 🧪 Scripts de Test et d'Intégration

Ce répertoire contient les scripts utilitaires pour tester l'application.

## 📋 Scripts disponibles

### 🐳 `run-docker-tests.sh`
**Tests d'intégration avec les conteneurs Docker**

Lance une suite complète de tests d'intégration contre les services en cours d'exécution dans Docker.

```bash
# Usage
./scripts/run-docker-tests.sh [email] [password]

# Exemples
./scripts/run-docker-tests.sh testuser@example.com securepassword
./scripts/run-docker-tests.sh  # Utilise les valeurs par défaut
```

**Prérequis :**
- Les conteneurs Docker doivent être en cours d'exécution
- Next.js accessible sur `http://localhost:3000`
- Services backend accessibles via le réseau Docker

**Ce qui est testé :**
- ✅ Communication proxy → backend
- ✅ Transmission du body des requêtes
- ✅ Transmission des cookies (Set-Cookie headers)
- ✅ Gestion des erreurs (codes HTTP)
- ✅ Cycle complet login → verify → refresh → logout

---

### 🔍 `test-integration-auth.sh`
**Tests d'intégration détaillés pour l'API Auth**

Script de test complet qui valide tous les endpoints de l'API Auth.

```bash
# Usage direct (rarement utilisé seul)
API_BASE="http://localhost:3000/api/auth" \
LOGIN="testuser@example.com" \
PASSWORD="securepassword" \
./scripts/test-integration-auth.sh
```

**Tests effectués :**
1. Health check (GET /health)
2. Version (GET /version)
3. Login avec credentials valides (POST /login)
4. Vérification de token (GET /verify)
5. Rafraîchissement de token (POST /refresh)
6. Déconnexion (POST /logout)
7. Login avec credentials invalides (POST /login)
8. Vérification sans token (GET /verify)
9. Configuration (GET /config)

**Résultat attendu :** 9/9 tests passent ✅

---

### 🛡️ `test-integration-guardian.sh`
**Tests d'intégration détaillés pour l'API Guardian (RBAC)**

Script de test complet qui valide tous les endpoints de l'API Guardian.

```bash
# Usage direct
API_BASE="http://localhost:3000/api/guardian" \
LOGIN="testuser@example.com" \
PASSWORD="securepassword" \
COMPANY_ID="test-company-123" \
USER_ID="test-user-123" \
./scripts/test-integration-guardian.sh
```

**Tests effectués :**
1. Health check (GET /health)
2. Version (GET /version)
3. Configuration (GET /config)
4. Liste permissions (GET /permissions)
5. Liste rôles (GET /roles)
6. Créer rôle (POST /roles)
7. Récupérer rôle par ID (GET /roles/{id})
8. Modifier rôle (PUT /roles/{id})
9. Liste policies (GET /policies)
10. Créer policy (POST /policies)
11. Vérifier accès (POST /check-access)
12. Liste user-roles (GET /users-roles)
13. Supprimer rôle (DELETE /roles/{id})
14. Supprimer policy (DELETE /policies/{id})

**Résultat attendu :** 14/14 tests passent ✅ (avec authentification)

---

### 🎯 `test-integration-all.sh`
**Lance tous les tests d'intégration (Auth + Guardian)**

Script maître qui exécute tous les tests d'intégration en séquence.

```bash
# Usage
./scripts/test-integration-all.sh
```

**Exécute :**
- Tests Auth complets
- Tests Guardian complets
- Fournit un résumé global

**Résumé fourni :**
```
  Auth Service:     ✓ PASS
  Guardian Service: ✓ PASS

🎉 ALL INTEGRATION TESTS PASSED!
```

---

### 🚀 `run-integration-tests.sh`
**Lance Next.js et exécute les tests** *(Pour environnement local)*

Lance automatiquement un serveur Next.js en développement, exécute les tests, puis arrête le serveur.

```bash
# Usage
AUTH_SERVICE_URL=http://localhost:5001 \
LOGIN="testuser@example.com" \
PASSWORD="securepassword" \
./scripts/run-integration-tests.sh
```

**Quand l'utiliser :**
- Tests en local sans Docker
- CI/CD pipelines
- Développement avec backend local

**Note :** Préférez `run-docker-tests.sh` si vous utilisez Docker.

---

## 🎯 Workflow recommandé

### Développement avec Docker (recommandé)

1. **Démarrer les services**
   ```bash
   docker-compose up -d web_service auth_service identity_service guardian_service
   ```

2. **Lancer les tests**
   ```bash
   ./scripts/run-docker-tests.sh
   ```

3. **Voir les logs en cas d'échec**
   ```bash
   docker-compose logs auth_service
   docker-compose logs web_service
   ```

### Développement local (sans Docker)

1. **Démarrer le backend**
   ```bash
   # Dans un terminal séparé
   cd services/auth_service
   flask run
   ```

2. **Lancer les tests avec Next.js**
   ```bash
   AUTH_SERVICE_URL=http://localhost:5001 \
   ./scripts/run-integration-tests.sh
   ```

---

## 🔧 Variables d'environnement

### Pour `run-docker-tests.sh`
```bash
LOGIN="email@example.com"     # Email de test (défaut: testuser@example.com)
PASSWORD="password"            # Mot de passe (défaut: securepassword)
```

### Pour `test-integration-auth.sh`
```bash
API_BASE="http://localhost:3000/api/auth"  # Base URL de l'API Auth
LOGIN="email@example.com"                   # Email de test
PASSWORD="password"                         # Mot de passe
```

### Pour `test-integration-guardian.sh`
```bash
API_BASE="http://localhost:3000/api/guardian"  # Base URL de l'API Guardian
AUTH_BASE="http://localhost:3000/api/auth"     # Base URL pour l'authentification
LOGIN="email@example.com"                       # Email de test
PASSWORD="password"                             # Mot de passe
COMPANY_ID="test-company-123"                   # ID de la compagnie de test
USER_ID="test-user-123"                         # ID de l'utilisateur de test
```

### Pour `run-integration-tests.sh`
```bash
AUTH_SERVICE_URL="http://..."  # URL du service d'authentification
MOCK_API="false"               # Mode mock (true/false)
PORT="3000"                    # Port Next.js
LOGIN="email@example.com"      # Email de test
PASSWORD="password"            # Mot de passe
```

---

## 📊 Interprétation des résultats

### ✅ Tous les tests passent
```
Tests passed: 9
Tests failed: 0
✓ All tests passed!
```
→ Le proxy fonctionne correctement, tous les aspects sont validés.

### ❌ Certains tests échouent
```
Tests passed: 7
Tests failed: 2
✗ Some tests failed
```
→ Vérifier :
1. Les services backend sont-ils en cours d'exécution ?
2. Les credentials sont-ils corrects ?
3. Les variables d'environnement sont-elles bien définies ?
4. Consulter les logs Docker

---

## 🐛 Debugging

### Voir les logs Next.js
```bash
docker-compose logs -f web_service
```

### Voir les logs Auth service
```bash
docker-compose logs -f auth_service
```

### Tester manuellement un endpoint
```bash
# Health check
curl http://localhost:3000/api/auth/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"securepassword"}'
```

### Mode debug du script
```bash
# Activer le mode debug bash
bash -x ./scripts/run-docker-tests.sh
```

---

## 📝 Ajouter de nouveaux tests

Pour ajouter un nouveau test dans `test-integration-auth.sh` :

1. **Créer une fonction de test**
   ```bash
   test_endpoint "GET" "/nouveau-endpoint" 200 "Description du test"
   ```

2. **Pour les tests avec body**
   ```bash
   data='{"key":"value"}'
   test_endpoint "POST" "/endpoint" 201 "Description" "$data"
   ```

3. **Pour les tests avec cookies**
   ```bash
   cookies="access_token=abc; refresh_token=xyz"
   test_endpoint "GET" "/endpoint" 200 "Description" "" "$cookies"
   ```

---

## 🎓 Exemples complets

### Test rapide du proxy
```bash
./scripts/run-docker-tests.sh
```

### Test avec credentials personnalisés
```bash
./scripts/run-docker-tests.sh admin@company.com MySecurePass123
```

### Test en mode debug
```bash
set -x
./scripts/run-docker-tests.sh
```

### Tester uniquement un service spécifique
```bash
# Tester manuellement un endpoint
curl -v http://localhost:3000/api/auth/health
```

---

## 📚 Documentation liée

- [Système de Proxy](../lib/proxy/README.md) - Documentation du système de proxy
- [Mode Mock](../docs/MOCK_MODE_GUIDE.md) - Guide d'utilisation des mocks
- [Spécification OpenAPI](../.spec/openapi.yml) - Spécification de l'API Auth

---

## ✅ Checklist avant commit

- [ ] `./scripts/run-docker-tests.sh` passe tous les tests
- [ ] Les nouveaux endpoints ont des tests
- [ ] La documentation est à jour
- [ ] Les mocks correspondent aux réponses réelles

---

*Dernière mise à jour : 19 octobre 2025*
