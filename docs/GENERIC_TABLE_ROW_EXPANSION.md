# GenericDataTable - Row Expansion Feature

## Vue d'ensemble

La fonctionnalité d'expansion de ligne permet d'afficher du contenu additionnel sous chaque ligne du tableau. Cette feature a été ajoutée pour supporter la migration du composant Policies vers GenericCrudTable.

## Utilisation

### Props

```typescript
interface GenericDataTableProps<T> {
  // ... props existantes
  
  /** Active l'expansion de ligne */
  enableRowExpansion?: boolean;
  
  /** Fonction de rendu pour le contenu étendu de la ligne */
  renderExpandedRow?: (item: T) => React.ReactNode;
  
  /** Callback appelé quand l'état d'expansion change */
  onRowExpansionChange?: (expandedRows: Record<string | number, boolean>) => void;
  
  /** État d'expansion initial */
  initialExpanded?: Record<string | number, boolean>;
}
```

### Exemple basique

```typescript
import { GenericDataTable } from '@/components/shared/GenericDataTable';

interface Policy {
  id: number;
  name: string;
  permissions: Permission[];
}

function PoliciesTable() {
  const columns: ColumnDef<Policy>[] = [
    { accessorKey: 'name', header: 'Nom de la politique' },
  ];

  const renderExpandedRow = (policy: Policy) => (
    <div className="p-4 bg-gray-50">
      <h4 className="font-semibold mb-2">Permissions :</h4>
      <ul className="list-disc pl-6">
        {policy.permissions.map(perm => (
          <li key={perm.id}>{perm.name}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <GenericDataTable
      data={policies}
      columns={columns}
      dictionary={dictionary}
      enableRowExpansion={true}
      renderExpandedRow={renderExpandedRow}
    />
  );
}
```

### Exemple avec état contrôlé

```typescript
function ControlledExpansion() {
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const handleExpansionChange = (newExpanded: Record<number, boolean>) => {
    setExpandedRows(newExpanded);
    console.log('Rows expanded:', Object.keys(newExpanded).filter(k => newExpanded[k]));
  };

  return (
    <GenericDataTable
      data={data}
      columns={columns}
      dictionary={dictionary}
      enableRowExpansion={true}
      renderExpandedRow={renderExpandedRow}
      onRowExpansionChange={handleExpansionChange}
      initialExpanded={expandedRows}
    />
  );
}
```

### Exemple avec expansion initiale

```typescript
// Ouvrir automatiquement les lignes 1 et 3
<GenericDataTable
  data={data}
  columns={columns}
  dictionary={dictionary}
  enableRowExpansion={true}
  renderExpandedRow={renderExpandedRow}
  initialExpanded={{ 1: true, 3: true }}
/>
```

## Détails d'implémentation

### Colonne d'expansion

Quand `enableRowExpansion={true}`, une colonne est automatiquement ajoutée au début du tableau avec :
- Icône `ChevronRight` quand la ligne est fermée
- Icône `ChevronDown` quand la ligne est ouverte
- Largeur fixe de 50px
- Tri et filtrage désactivés

### Ordre des colonnes

Les colonnes sont injectées dans cet ordre :
1. Colonne d'expansion (si `enableRowExpansion`)
2. Colonne de sélection (si `enableRowSelection`)
3. Colonnes de données

### Gestion de l'état

L'état d'expansion est géré en interne par `useState`, mais peut être synchronisé avec l'état parent via `onRowExpansionChange` et `initialExpanded`.

### Contraintes

- Les lignes **doivent avoir un champ `id`** (string ou number) pour être extensibles
- Si une ligne n'a pas d'`id`, aucun bouton d'expansion n'est affiché pour cette ligne
- Le contenu étendu prend toute la largeur du tableau (`colSpan={finalColumns.length}`)

## Tests

La suite de tests `GenericDataTable.expansion.test.tsx` couvre :
- Rendu par défaut (pas d'expansion)
- Affichage de la colonne d'expansion
- Expansion/contraction au clic
- Expansion multiple simultanée
- Callback `onRowExpansionChange`
- État initial via `initialExpanded`
- Gestion des lignes sans `id`

## Migration depuis un tableau custom

### Avant (tableau custom avec expansion)

```typescript
const [expanded, setExpanded] = useState<Record<number, boolean>>({});

const toggleExpand = (id: number) => {
  setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
};

// Dans le rendu
<TableRow>
  <TableCell>
    <button onClick={() => toggleExpand(row.id)}>
      {expanded[row.id] ? <ChevronDown /> : <ChevronRight />}
    </button>
  </TableCell>
  <TableCell>{row.name}</TableCell>
</TableRow>
{expanded[row.id] && (
  <TableRow>
    <TableCell colSpan={columns.length}>
      {/* Contenu étendu */}
    </TableCell>
  </TableRow>
)}
```

### Après (GenericDataTable)

```typescript
const renderExpandedRow = (row: YourType) => {
  return <div>{/* Contenu étendu */}</div>;
};

<GenericDataTable
  data={data}
  columns={columns}
  dictionary={dictionary}
  enableRowExpansion={true}
  renderExpandedRow={renderExpandedRow}
/>
```

## Compatibilité

- ✅ Rétrocompatible : tous les props sont optionnels
- ✅ Compatible avec `enableRowSelection`
- ✅ Compatible avec tri, filtrage, pagination
- ✅ Fonctionne avec import/export (le contenu étendu n'est pas exporté)
- ✅ Supporte TypeScript strict mode

## Roadmap

Fonctionnalités futures potentielles :
- [ ] Mode "single expansion" (un seul row ouvert à la fois)
- [ ] Animation de transition smooth
- [ ] Expansion conditionnelle par ligne (via callback)
- [ ] Export enrichi (inclure données étendues)
