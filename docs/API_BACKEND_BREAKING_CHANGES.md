# Analyse Complète des Breaking Changes API Backend

**Date**: 23 Novembre 2025  
**Status**: 🔴 CRITIQUE - Plusieurs breaking changes identifiés

## 🚨 Problèmes Critiques Identifiés

### 1. Guardian - Format des Opérations ❌

**Erreur actuelle dans les logs:**
```
WARNING utils.py:250 check_access: {"operation": "read", "event": "check_access: invalid operation"}
```

#### Spec OpenAPI Guardian

**Permission Schema:**
```yaml
Permission:
  properties:
    operation:
      type: string
      enum: [LIST, CREATE, READ, UPDATE, DELETE]  # ✅ MAJUSCULES + SINGULIER
      description: Single operation allowed by this permission
```

**CheckAccessRequest:**
```yaml
CheckAccessRequest:
  properties:
    operation:
      type: string
      enum: [list, create, read, update, delete]  # ⚠️ minuscules acceptées
      description: |
        Operation to perform on the resource.
        Note: Operations are automatically normalized to uppercase
```

#### Frontend Actuel ❌

**`lib/permissions.ts`** - Toutes les actions sont en minuscules:
```typescript
IDENTITY_USER_LIST: { service: 'identity', resource: 'user', action: 'list' }, // ❌
IDENTITY_USER_READ: { service: 'identity', resource: 'user', action: 'read' }, // ❌
```

**`lib/proxy/mocks.ts`** - Mocks utilisent minuscules ET array:
```typescript
operations: ["list", "create", "read", "update", "delete"], // ❌ minuscules + array
operation: "read" // ❌ minuscules
```

#### Solution ✅

1. **Modifier `lib/permissions.ts`** : Toutes les actions en MAJUSCULES
2. **Modifier les mocks** : `operation` (singulier) en MAJUSCULES
3. **Vérifier tous les appels à `/check-access`**

---

### 2. Guardian - Structure Permission

#### Spec OpenAPI ✅
```yaml
Permission:
  properties:
    id: string (uuid)
    service: string
    resource_name: string          # ✅ resource_NAME
    operation: string              # ✅ SINGULIER
    description: string
```

#### Frontend Actuel ❌
```typescript
interface Permission {
  service: string;
  resource: string;    // ❌ Devrait être resource_name
  action: string;      // ❌ Devrait être operation
}
```

#### Solution ✅
Créer un nouveau type `ApiPermission` conforme aux specs:
```typescript
interface ApiPermission {
  id: string;
  service: string;
  resource_name: string;
  operation: 'LIST' | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  description: string;
  created_at?: string;
  updated_at?: string;
}
```

---

### 3. Identity - Nouveaux Endpoints Password Reset

#### Nouveaux endpoints (Phase 2) :

**`POST /users/password-reset/request`** (public, sans auth)
```yaml
requestBody:
  email: string (format: email)
responses:
  200: "If an account with this email exists, a password reset code has been sent."
  # Toujours 200 pour éviter l'énumération d'emails
```

**`POST /users/password-reset/confirm`** (public, sans auth)
```yaml
requestBody:
  email: string
  otp_code: string (pattern: ^\d{6}$)
  new_password: string (minLength: 8)
responses:
  200: "Password reset successful"
```

**`POST /users/{user_id}/admin-reset-password`** (admin only)
```yaml
responses:
  200:
    temporary_password: string
    password_reset_required: true
    note: "User must change password on next login"
```

**`PATCH /users/me/change-password`**
```yaml
requestBody:
  current_password: string
  new_password: string (minLength: 8)
```

#### À implémenter :
- [ ] Composant de demande de reset password
- [ ] Composant de confirmation avec OTP
- [ ] Bouton admin reset password
- [ ] Formulaire change password utilisateur

---

### 4. Identity - Nouveaux champs User

#### Nouveaux champs dans User schema:
```yaml
User:
  properties:
    password_reset_required:
      type: boolean
      default: false
      readOnly: true
      description: Must change password on next login
      
    last_password_change:
      type: string
      format: date-time
      readOnly: true
      description: Timestamp of last password change
```

---

### 5. Guardian - UserRoleInput accepte company_id optionnel

#### Spec OpenAPI:
```yaml
UserRoleInput:
  properties:
    user_id: string (uuid) - required
    role_id: string (uuid) - required  
    company_id: string (uuid) - optional
      description: Can be extracted from JWT if not provided
```

#### Frontend actuel:
```typescript
// components/admin/UserManagement.tsx
body: JSON.stringify({ 
  user_id: createdUser.id,
  role_id: roleId 
  // ✅ Correct - company_id optionnel
})
```

---

### 6. Guardian - /init-db formats multiples

#### Déjà corrigé ✅
```typescript
// components/initApp.tsx - utilise format plat
body: JSON.stringify({
  company_id: identityData.company.id,
  user_id: identityData.user.id,
})
```

---

## 📊 Récapitulatif des Changements Requis

### Priorité 1 - CRITIQUE 🔴

1. **Normaliser les opérations en MAJUSCULES**
   - [ ] `lib/permissions.ts` : LIST, CREATE, READ, UPDATE, DELETE
   - [ ] `lib/proxy/mocks.ts` : operation (singulier) en MAJUSCULES
   - [ ] Tous les tests utilisant des opérations

2. **Corriger l'interface Permission**
   - [ ] Créer `ApiPermission` avec `resource_name` et `operation`
   - [ ] Mapper entre Permission (frontend) et ApiPermission (backend)

### Priorité 2 - Important 🟡

3. **Implémenter Password Reset**
   - [ ] Flow utilisateur (request + confirm)
   - [ ] Flow admin (reset password)
   - [ ] Change password utilisateur

4. **Mettre à jour les types User**
   - [ ] Ajouter `password_reset_required`
   - [ ] Ajouter `last_password_change`

### Priorité 3 - Nice to have 🟢

5. **Optimisations diverses**
   - [ ] Vérifier tous les endpoints pour d'autres changements mineurs
   - [ ] Mettre à jour la documentation

---

## 🔧 Plan d'Action Proposé

### Étape 1: Corriger les opérations (30 min)
1. Modifier `lib/permissions.ts`
2. Modifier `lib/proxy/mocks.ts`
3. Tester avec vrais backends

### Étape 2: Harmoniser les types Permission (1h)
1. Créer type `ApiPermission`
2. Créer fonctions de mapping
3. Adapter les appels API

### Étape 3: Password Reset (3h)
1. Implémenter les composants
2. Intégrer dans les flows
3. Tests

---

**Prochaine action recommandée** : Commencer par l'Étape 1 (opérations) car c'est ce qui bloque actuellement.

Voulez-vous que je procède à ces corrections ?
