# Global Error Handler

Gestionnaire d'erreurs global pour l'application avec support i18n et notifications toast.

## Architecture

### Composants

1. **`useErrorHandler` Hook** (`lib/hooks/useErrorHandler.ts`)
   - Hook React pour gérer les erreurs HTTP
   - Affiche des toasts avec messages traduits
   - Convertit automatiquement les erreurs en `HttpError`

2. **Dictionnaires d'erreurs** (`dictionaries/{en,fr}/errors.json`)
   - Messages traduits pour chaque type d'erreur
   - Intégrés au système de dictionnaires existant

3. **Toaster UI** (`components/ui/sonner.tsx`)
   - Composant Sonner de shadcn/ui
   - Intégré au layout global

## Utilisation

### Dans un composant client

```tsx
"use client";

import { fetchWithAuthJSON } from '@/lib/fetchWithAuth';
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
import { getDictionary } from '@/lib/utils/dictionaries';

export function MyComponent({ dictionary }) {
  const { handleError } = useErrorHandler({ 
    messages: dictionary.errors 
  });

  async function loadData() {
    try {
      const data = await fetchWithAuthJSON('/api/data');
      // ...
    } catch (error) {
      handleError(error); // Affiche un toast automatiquement
    }
  }

  return (
    <button onClick={loadData}>Charger</button>
  );
}
```

### Options avancées

```tsx
const { handleError } = useErrorHandler({ 
  messages: dictionary.errors,
  showToast: true,           // Afficher toast (défaut: true)
  duration: 5000,            // Durée en ms (défaut: 5000)
  onError: (error) => {      // Action personnalisée
    if (error.type === HttpErrorType.UNAUTHORIZED) {
      // Rediriger vers /login par exemple
    }
  }
});
```

### Types d'erreurs gérées

- `NETWORK` - Problème de connexion réseau
- `UNAUTHORIZED` (401) - Session expirée
- `FORBIDDEN` (403) - Permissions insuffisantes
- `NOT_FOUND` (404) - Ressource non trouvée
- `SERVER_ERROR` (5xx) - Erreur serveur
- `CLIENT_ERROR` (4xx) - Erreur client
- `UNKNOWN` - Erreur inconnue

### Toasts par sévérité

- **Error toast** : Erreurs réseau, serveur, client
- **Warning toast** : Session expirée (401)

## Migration d'autres composants

Pour migrer un composant existant :

1. Importer le hook :
```tsx
import { useErrorHandler } from '@/lib/hooks/useErrorHandler';
```

2. Initialiser dans le composant :
```tsx
const { handleError } = useErrorHandler({ messages: dictionary.errors });
```

3. Remplacer les blocs `try/catch` :
```tsx
// Avant
try {
  await fetchAPI();
} catch (error) {
  console.error(error);
  setErrorMessage('Une erreur est survenue');
}

// Après
try {
  await fetchAPI();
} catch (error) {
  handleError(error); // Gère toast + logging automatiquement
}
```

## Tests

Le hook est testé avec :
- Conversion des erreurs JavaScript en `HttpError`
- Affichage des toasts selon le type d'erreur
- Support des messages serveur personnalisés
- Actions personnalisées via callback

## Prochaines étapes

- [ ] Migrer les composants existants (Issue à créer)
- [ ] Ajouter des tests E2E pour les toasts
- [ ] Ajouter support pour les erreurs de validation de formulaire
- [ ] Ajouter analytics/monitoring des erreurs
