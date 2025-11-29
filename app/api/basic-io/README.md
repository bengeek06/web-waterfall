# Basic I/O Service Integration

Le service Basic I/O a été intégré au proxy Next.js pour faciliter les opérations d'import/export de données.

## Routes disponibles

### Endpoints système
- `GET /api/basic-io/health` - Vérification de santé du service
- `GET /api/basic-io/version` - Version du service  
- `GET /api/basic-io/config` - Configuration du service

### Endpoints fonctionnels
- `GET /api/basic-io/export` - Export de données depuis un endpoint Waterfall
- `POST /api/basic-io/import` - Import de données vers un endpoint Waterfall
- `GET /api/basic-io/schemas` - Liste des schémas disponibles
- `GET /api/basic-io/schemas/[name]` - Détails d'un schéma spécifique

## Configuration

Ajouter la variable d'environnement dans `.env.local`:

```bash
BASIC_IO_SERVICE_URL=http://localhost:5006
```

## Utilisation

### Export

```bash
# Export JSON avec métadonnées enrichies
curl "http://localhost:3000/api/basic-io/export?service=identity&endpoint=customers&type=json&enrich=true" \
  --cookie "access_token=YOUR_JWT"

# Export CSV
curl "http://localhost:3000/api/basic-io/export?service=identity&endpoint=customers&type=csv" \
  --cookie "access_token=YOUR_JWT"

# Export avec IDs spécifiques
curl "http://localhost:3000/api/basic-io/export?service=identity&endpoint=customers&ids=uuid1,uuid2" \
  --cookie "access_token=YOUR_JWT"
```

### Import

```bash
# Import JSON avec résolution automatique des FK
curl -X POST "http://localhost:3000/api/basic-io/import?service=identity&endpoint=customers&type=json&resolve_refs=true" \
  --cookie "access_token=YOUR_JWT" \
  -F "file=@customers.json"

# Import CSV
curl -X POST "http://localhost:3000/api/basic-io/import?service=identity&endpoint=customers&type=csv" \
  --cookie "access_token=YOUR_JWT" \
  -F "file=@customers.csv"
```

### Schémas

```bash
# Liste tous les schémas
curl "http://localhost:3000/api/basic-io/schemas" \
  --cookie "access_token=YOUR_JWT"

# Schémas par service
curl "http://localhost:3000/api/basic-io/schemas?service=identity" \
  --cookie "access_token=YOUR_JWT"

# Détails d'un schéma
curl "http://localhost:3000/api/basic-io/schemas/customers" \
  --cookie "access_token=YOUR_JWT"
```

## Hook useBasicIO

Le hook `useBasicIO` permet d'intégrer facilement l'import/export dans les composants React :

```typescript
import { useBasicIO } from '@/lib/hooks/useBasicIO';

function MyComponent() {
  const { exportData, importData, isExporting, isImporting } = useBasicIO({
    service: 'identity',
    endpoint: 'customers',
    entityName: 'customers', // Pour le nom du fichier
    onExportSuccess: () => toast.success('Export terminé'),
    onImportSuccess: (report) => {
      toast.success(`${report.import_report.success} éléments importés`);
      refresh();
    },
  });

  // Export JSON
  await exportData({ format: 'json' });

  // Export CSV avec IDs sélectionnés
  await exportData({ format: 'csv', ids: selectedIds });

  // Import
  await importData({ format: 'json' });
}
```

## Intégration GenericCrudTable

`GenericCrudTable` utilise automatiquement `useBasicIO` quand `enableImportExport={true}` :

```tsx
<GenericCrudTable
  service="identity"
  path="/customers"
  entityName="customers"
  enableImportExport={true}
  // Pas besoin de onImport/onExport - basic-io est utilisé automatiquement
/>
```

## Tests

Les tests unitaires sont disponibles dans `app/api/basic-io/*/route.test.ts` et `lib/hooks/useBasicIO.test.ts`.

Pour lancer les tests:
```bash
npm test -- app/api/basic-io
npm test -- useBasicIO
```

## Documentation complète

- [OpenAPI Spec](https://github.com/bengeek06/basic-io-api-waterfall/blob/develop/openapi.yml)
- [Ticket #52](https://github.com/bengeek06/web-waterfall/issues/52)
