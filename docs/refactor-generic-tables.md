# Refactor: Create generic table components and hooks

## Objectif
Réduire la duplication de code entre les tables (users, customers, subcontractors, companies, etc.) en créant des composants et hooks réutilisables.

## Problème actuel
Chaque table réimplémente:
- Colonnes d'actions (Edit/Delete)
- Colonnes de dates (Created/Updated)
- Colonnes de statut
- CRUD operations (Create/Read/Update/Delete)
- Formulaires de création/édition
- Gestion des états (loading, error)
- Patterns de fetching identiques

**Résultat:** Code dupliqué difficile à maintenir, comportements inconsistants, bugs répétés.

## Architecture proposée

### 1. Reusable Column Builders (`lib/table-columns.tsx`)

Constructeurs de colonnes réutilisables pour patterns communs:

```typescript
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenu, Button } from "@/components/ui";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export interface ActionCallbacks<T> {
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
}

export interface ColumnDictionary {
  actions: string;
  edit: string;
  delete: string;
  view: string;
  confirm_delete: string;
}

/**
 * Creates a standard actions column with Edit/Delete dropdown
 */
export function createActionColumn<T>(
  callbacks: ActionCallbacks<T>,
  dictionary: ColumnDictionary
): ColumnDef<T> {
  return {
    id: "actions",
    header: dictionary.actions,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {callbacks.onView && (
              <DropdownMenuItem onClick={() => callbacks.onView(item)}>
                <Eye className="mr-2 h-4 w-4" />
                {dictionary.view}
              </DropdownMenuItem>
            )}
            {callbacks.onEdit && (
              <DropdownMenuItem onClick={() => callbacks.onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                {dictionary.edit}
              </DropdownMenuItem>
            )}
            {callbacks.onDelete && (
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm(dictionary.confirm_delete)) {
                    callbacks.onDelete(item);
                  }
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {dictionary.delete}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}

/**
 * Creates a formatted date column
 */
export function createDateColumn<T>(
  accessorKey: keyof T,
  header: string,
  format: string = 'PPP' // date-fns format
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const date = row.getValue(accessorKey as string);
      if (!date) return '—';
      return format(new Date(date), format);
    },
  };
}

/**
 * Creates a status badge column
 */
export function createStatusColumn<T>(
  accessorKey: keyof T,
  header: string,
  statusConfig: Record<string, { label: string; variant: string }>
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const status = row.getValue(accessorKey as string);
      const config = statusConfig[status] || { label: status, variant: 'default' };
      return (
        <Badge variant={config.variant}>
          {config.label}
        </Badge>
      );
    },
  };
}

/**
 * Creates a boolean column with checkmark/cross
 */
export function createBooleanColumn<T>(
  accessorKey: keyof T,
  header: string
): ColumnDef<T> {
  return {
    accessorKey: accessorKey as string,
    header,
    cell: ({ row }) => {
      const value = row.getValue(accessorKey as string);
      return value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />;
    },
  };
}
```

**Usage:**
```typescript
// app/welcome/admin/users/columns.tsx
import { createActionColumn, createDateColumn, createStatusColumn } from '@/lib/table-columns';

export const userColumns: ColumnDef<User>[] = [
  { accessorKey: 'username', header: dict.username },
  { accessorKey: 'email', header: dict.email },
  createStatusColumn('status', dict.status, {
    active: { label: dict.active, variant: 'success' },
    inactive: { label: dict.inactive, variant: 'secondary' },
  }),
  createDateColumn('created_at', dict.created),
  createActionColumn(
    { onEdit: handleEdit, onDelete: handleDelete },
    dict
  ),
];
```

### 2. Generic CRUD Hook (`hooks/useTableCrud.ts`)

Hook réutilisable pour toutes les opérations CRUD:

```typescript
import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';

export interface CrudConfig {
  service: string;      // 'identity', 'guardian', etc.
  path: string;         // '/users', '/companies', etc.
  revalidateOnFocus?: boolean;
}

export function useTableCrud<T>(config: CrudConfig) {
  const { service, path, revalidateOnFocus = false } = config;
  
  // Fetch data with SWR
  const { data, error, mutate } = useSWR(
    `${service}${path}`,
    () => fetch(`/api/${service}${path}`).then(r => r.json()),
    { revalidateOnFocus }
  );

  const [isLoading, setIsLoading] = useState(false);

  // Create
  const create = useCallback(async (item: Partial<T>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${service}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) throw new Error('Create failed');
      
      const created = await response.json();
      mutate(); // Revalidate
      return created;
    } finally {
      setIsLoading(false);
    }
  }, [service, path, mutate]);

  // Update
  const update = useCallback(async (id: string, item: Partial<T>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${service}${path}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      const updated = await response.json();
      mutate(); // Revalidate
      return updated;
    } finally {
      setIsLoading(false);
    }
  }, [service, path, mutate]);

  // Delete
  const remove = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/${service}${path}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      mutate(); // Revalidate
    } finally {
      setIsLoading(false);
    }
  }, [service, path, mutate]);

  return {
    data: data || [],
    error,
    isLoading: !error && !data || isLoading,
    create,
    update,
    remove,
    refresh: mutate,
  };
}
```

**Usage:**
```typescript
// app/welcome/admin/users/page.tsx
const { data, isLoading, create, update, remove } = useTableCrud<User>({
  service: 'identity',
  path: '/users',
});
```

### 3. Generic DataTable Component (`components/tables/GenericDataTable.tsx`)

Composant table générique avec fonctionnalités communes:

```typescript
import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';

export interface GenericDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  dictionary: {
    create_button: string;
    search_placeholder?: string;
    no_results?: string;
  };
  onCreateClick?: () => void;
  enableImportExport?: boolean;
  onExport?: () => void;
  onImport?: (file: File) => void;
  searchKey?: string; // Column to search on
}

export function GenericDataTable<T>({
  columns,
  data,
  isLoading,
  dictionary,
  onCreateClick,
  enableImportExport,
  onExport,
  onImport,
  searchKey,
}: GenericDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredData = searchKey && searchTerm
    ? data.filter(item => 
        String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : data;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {onCreateClick && (
            <Button onClick={onCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              {dictionary.create_button}
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {enableImportExport && (
            <>
              {onImport && (
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Search */}
      {searchKey && (
        <Input
          placeholder={dictionary.search_placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 4. Generic Form Component (`components/forms/GenericForm.tsx`)

Formulaire réutilisable avec react-hook-form + zod:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select
}

export interface GenericFormProps<T extends z.ZodType> {
  schema: T;
  fields: FieldConfig[];
  onSubmit: (data: z.infer<T>) => Promise<void>;
  defaultValues?: Partial<z.infer<T>>;
  dictionary: {
    submit: string;
    cancel: string;
  };
  onCancel?: () => void;
}

export function GenericForm<T extends z.ZodType>({
  schema,
  fields,
  onSubmit,
  defaultValues,
  dictionary,
  onCancel,
}: GenericFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<T>) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {field.type === 'select' ? (
                    <Select {...formField}>
                      {field.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                  ) : field.type === 'textarea' ? (
                    <Textarea {...formField} placeholder={field.placeholder} />
                  ) : (
                    <Input
                      {...formField}
                      type={field.type}
                      placeholder={field.placeholder}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {dictionary.cancel}
            </Button>
          )}
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {dictionary.submit}
          </Button>
        </div>
      </form>
    </Form>
  );
}
```

## Exemple complet: Users Table

**Avant (code dupliqué):**
```typescript
// ~300 lignes de code avec CRUD, colonnes, formulaire, etc.
```

**Après (code réutilisé):**
```typescript
// app/welcome/admin/users/page.tsx
import { useTableCrud } from '@/hooks/useTableCrud';
import { GenericDataTable } from '@/components/tables/GenericDataTable';
import { createActionColumn, createDateColumn } from '@/lib/table-columns';

export default function UsersPage() {
  const dict = getDictionary('users');
  const { data, isLoading, create, update, remove } = useTableCrud<User>({
    service: 'identity',
    path: '/users',
  });

  const columns = [
    { accessorKey: 'username', header: dict.username },
    { accessorKey: 'email', header: dict.email },
    createDateColumn('created_at', dict.created),
    createActionColumn({ onEdit: handleEdit, onDelete: remove }, dict),
  ];

  return (
    <GenericDataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      dictionary={dict}
      onCreateClick={() => setShowCreateModal(true)}
      searchKey="username"
    />
  );
}

// ~50 lignes au lieu de 300!
```

## Bénéfices

✅ **Réduction massive du code** - ~80% de code en moins par table
✅ **Comportement cohérent** - Toutes les tables fonctionnent pareil
✅ **Maintenabilité** - Corrections/features en un seul endroit
✅ **Type-safe** - Typé avec TypeScript/Zod
✅ **Tests simplifiés** - Tester les helpers au lieu de chaque table
✅ **Onboarding rapide** - Pattern clair et documenté
✅ **Nouvelles tables en minutes** - Juste définir colonnes et schema

## Plan de migration

### Phase 1: Fondations (1-2 jours)
1. Créer `lib/table-columns.tsx` avec column builders
2. Créer `hooks/useTableCrud.ts` avec SWR
3. Créer `components/tables/GenericDataTable.tsx`
4. Créer `components/forms/GenericForm.tsx`

### Phase 2: Validation (1 jour)
5. Refactorer **Users table** comme pilot
6. Tester toutes les fonctionnalités (CRUD, search, export)
7. Ajuster les APIs si nécessaire

### Phase 3: Migration progressive (3-5 jours)
8. Refactorer **Companies table**
9. Refactorer **Customers table**
10. Refactorer **Subcontractors table**
11. Autres tables restantes

### Phase 4: Cleanup
12. Supprimer ancien code dupliqué
13. Documenter patterns dans docs/
14. Créer guide pour nouvelles tables

## Considérations

**Performance:**
- SWR gère le caching automatiquement
- Revalidation intelligente
- Optimistic updates possibles

**Extensibilité:**
- Column builders extensibles pour nouveaux types
- Hook CRUD peut être étendu (batch operations, etc.)
- GenericForm peut supporter plus de field types

**Edge cases:**
- Tables avec colonnes très spécifiques → mixer generic + custom columns
- Formulaires complexes → composer plusieurs GenericForm ou fallback custom
- Relations complexes → étendre useTableCrud avec options avancées

## Dictionnaires communs

Créer `dictionaries/en/common-table.json`:
```json
{
  "actions": "Actions",
  "edit": "Edit",
  "delete": "Delete",
  "view": "View",
  "confirm_delete": "Are you sure you want to delete this item?",
  "create_button": "Create",
  "search_placeholder": "Search...",
  "no_results": "No results found",
  "loading": "Loading...",
  "submit": "Submit",
  "cancel": "Cancel",
  "created": "Created",
  "updated": "Updated"
}
```

## Conclusion

Cette refactorisation transforme un codebase avec beaucoup de duplication en une architecture modulaire, maintenable et extensible. C'est un investissement initial qui se rentabilise très vite.

**ROI estimé:**
- Temps de développement d'une nouvelle table: 2h → 30min
- Bugs de régression: -70%
- Tests à maintenir: -80%
- Onboarding nouveaux devs: -50%
