# Basic I/O Service Integration

Le service Basic I/O a été intégré au proxy Next.js pour faciliter les opérations d'import/export de données.

## Routes ajoutées

### Endpoints système
- `GET /api/basic_io/health` - Vérification de santé du service
- `GET /api/basic_io/version` - Version du service  
- `GET /api/basic_io/config` - Configuration du service

### Endpoints fonctionnels
- `GET /api/basic_io/export` - Export de données depuis un endpoint Waterfall
- `POST /api/basic_io/import` - Import de données vers un endpoint Waterfall

## Configuration

Ajouter la variable d'environnement dans `.env.local`:

```bash
BASIC_IO_SERVICE_URL=http://localhost:5006
```

## Utilisation

### Export
```bash
curl "http://localhost:3000/api/basic_io/export?url=http://localhost:5002/api/users&type=json&enrich=true" \
  --cookie "access_token=YOUR_JWT"
```

### Import
```bash
curl -X POST "http://localhost:3000/api/basic_io/import?url=http://localhost:5002/api/users&type=json" \
  --cookie "access_token=YOUR_JWT" \
  -F "file=@users.json"
```

## Tests

Les tests unitaires sont disponibles dans `app/api/basic_io/*/route.test.ts`.

Pour lancer les tests:
```bash
npm test -- app/api/basic_io
```

## Documentation complète

Voir les fichiers dans `.spec/`:
- `basic_io_api.yml` - Spécification OpenAPI
- `README.basic_io.md` - Documentation détaillée du service
