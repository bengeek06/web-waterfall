# Validation avec Zod + React Hook Form

Ce guide explique comment utiliser la validation centralisée avec Zod et React Hook Form dans le projet.

## 📦 Installation

Les packages suivants sont déjà installés :
- `zod` - Validation de schémas TypeScript-first
- `react-hook-form` - Gestion de formulaires performante
- `@hookform/resolvers` - Intégration Zod + React Hook Form

## 🎯 Utilisation de base

### 1. Importer le schéma et le hook

```tsx
import { useZodForm } from '@/lib/hooks';
import { loginSchema, LoginFormData } from '@/lib/validation';
```

### 2. Utiliser dans un composant

```tsx
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    // data est entièrement typé et validé !
    console.log(data.email, data.password);
    await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button type="submit" disabled={isSubmitting}>
        Se connecter
      </button>
    </form>
  );
}
```

## 📚 Schémas disponibles

### Auth (`lib/validation/auth.schemas.ts`)

- **`loginSchema`** → `LoginFormData`
  - email (requis, format email)
  - password (requis, min 6 caractères)

- **`registerSchema`** → `RegisterFormData`
  - email, name, password, confirmPassword
  - Validation: majuscule, minuscule, chiffre
  - Validation: passwords match

- **`initAppSchema`** → `InitAppFormData`
  - companyName, userName, userEmail, password, confirmPassword
  - Validation forte du mot de passe

- **`changePasswordSchema`** → `ChangePasswordFormData`
  - currentPassword, newPassword, confirmPassword
  - Validation: nouveau ≠ ancien

### Guardian (`lib/validation/guardian.schemas.ts`)

- **`policySchema`** → `PolicyFormData`
  - name (requis, 3-100 chars, regex alphanumeric)
  - description (optionnel, max 500 chars)

- **`roleSchema`** → `RoleFormData`
  - name, description

- **`permissionSchema`** → `PermissionFormData`
  - service, resource_name, operation (enum)
  - description (optionnel)

- **`userRoleAssignmentSchema`** → `UserRoleAssignmentFormData`
  - userId, roleId

- **`policyPermissionAssignmentSchema`** → `PolicyPermissionAssignmentFormData`
  - policyId, permissionIds (array)

### Identity (`lib/validation/identity.schemas.ts`)

- **`userSchema`** → `UserFormData`
  - name, email, phone (optionnel), position (optionnel)

- **`companySchema`** → `CompanyFormData`
  - name, description, address, phone, email, website

- **`organizationUnitSchema`** → `OrganizationUnitFormData`
  - name, description, parentId (optionnel)

- **`positionSchema`** → `PositionFormData`
  - title, description, departmentId

- **`profileUpdateSchema`** → `ProfileUpdateFormData`
  - name, email, phone, avatar

## 🔧 Fonctionnalités avancées

### Validation conditionnelle

```tsx
const schema = z.object({
  type: z.enum(['user', 'admin']),
  email: z.string().email(),
}).refine((data) => {
  // Validation custom
  if (data.type === 'admin' && !data.email.endsWith('@admin.com')) {
    return false;
  }
  return true;
}, {
  message: 'Les admins doivent avoir un email @admin.com',
  path: ['email'],
});
```

### Validation asynchrone

```tsx
const schema = z.object({
  email: z.string().email(),
}).refine(async (data) => {
  // Vérifier si email existe déjà
  const exists = await checkEmailExists(data.email);
  return !exists;
}, {
  message: 'Cet email est déjà utilisé',
  path: ['email'],
});
```

### Réutilisation de schémas

```tsx
// Étendre un schéma existant
const extendedUserSchema = userSchema.extend({
  avatar: z.string().url(),
  bio: z.string().max(500),
});

// Rendre des champs optionnels
const partialUserSchema = userSchema.partial();

// Sélectionner certains champs
const userEmailSchema = userSchema.pick({ email: true });
```

### Mode de validation

```tsx
const form = useZodForm({
  schema: loginSchema,
  mode: 'onBlur', // Valide quand on quitte le champ
  // mode: 'onChange', // Valide à chaque frappe
  // mode: 'onSubmit', // Valide seulement au submit (défaut)
});
```

## 🎨 Intégration avec shadcn/ui

```tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

export function MyForm() {
  const form = useZodForm({
    schema: mySchema,
    defaultValues: { ... },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

## 🧪 Tests

Les schémas Zod peuvent être testés directement :

```tsx
import { loginSchema } from '@/lib/validation';

describe('loginSchema', () => {
  it('should accept valid data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Email invalide');
    }
  });
});
```

## 📖 Exemples complets

### Exemple 1: Login Form

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useZodForm } from '@/lib/hooks';
import { loginSchema, LoginFormData } from '@/lib/validation';
import { AUTH_ROUTES } from '@/lib/api-routes';
import { AUTH_TEST_IDS, testId } from '@/lib/test-ids';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const response = await fetch(AUTH_ROUTES.login, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Échec de la connexion');
      }

      router.push('/welcome');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} {...testId(AUTH_TEST_IDS.login.form)}>
      <div>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          {...testId(AUTH_TEST_IDS.login.emailInput)}
        />
        {errors.email && (
          <span className="text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">Mot de passe</label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          {...testId(AUTH_TEST_IDS.login.passwordInput)}
        />
        {errors.password && (
          <span className="text-red-500">{errors.password.message}</span>
        )}
      </div>

      {error && (
        <div className="text-red-500" {...testId(AUTH_TEST_IDS.login.errorMessage)}>
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        {...testId(AUTH_TEST_IDS.login.submitButton)}
      >
        {isSubmitting ? 'Connexion...' : 'Se connecter'}
      </Button>
    </form>
  );
}
```

### Exemple 2: Policy Form

```tsx
'use client';

import { useZodForm } from '@/lib/hooks';
import { policySchema, PolicyFormData } from '@/lib/validation';
import { GUARDIAN_ROUTES } from '@/lib/api-routes';
import { DASHBOARD_TEST_IDS, testId } from '@/lib/test-ids';

interface PolicyFormProps {
  policy?: PolicyFormData & { id: string };
  onSuccess?: () => void;
}

export function PolicyForm({ policy, onSuccess }: PolicyFormProps) {
  const isEditing = !!policy;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm({
    schema: policySchema,
    defaultValues: policy || {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data: PolicyFormData) => {
    const url = isEditing
      ? GUARDIAN_ROUTES.policy(policy.id)
      : GUARDIAN_ROUTES.policies;
    
    const response = await fetch(url, {
      method: isEditing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} {...testId(DASHBOARD_TEST_IDS.policies.dialog)}>
      <div>
        <label>Nom de la policy</label>
        <input {...register('name')} {...testId(DASHBOARD_TEST_IDS.policies.nameInput)} />
        {errors.name && <span className="text-red-500">{errors.name.message}</span>}
      </div>

      <div>
        <label>Description (optionnel)</label>
        <textarea {...register('description')} {...testId(DASHBOARD_TEST_IDS.policies.descriptionInput)} />
        {errors.description && <span className="text-red-500">{errors.description.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting} {...testId(DASHBOARD_TEST_IDS.policies.submitButton)}>
        {isSubmitting ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer'}
      </button>
    </form>
  );
}
```

## ✨ Avantages

1. **Type Safety** - Types TypeScript automatiquement inférés
2. **Validation centralisée** - Un seul endroit pour toutes les règles
3. **Réutilisable** - Même schéma côté client et serveur
4. **Messages d'erreur** - Messages en français personnalisés
5. **Performance** - Validation optimisée par React Hook Form
6. **Tests** - Schémas facilement testables
7. **DX** - Autocomplétion et erreurs TypeScript

## 🔗 Ressources

- [Zod Documentation](https://zod.dev)
- [React Hook Form Documentation](https://react-hook-form.com)
- [@hookform/resolvers](https://github.com/react-hook-form/resolvers)
