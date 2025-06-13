# Voisin Solidaire

Application de solidarité entre voisins, permettant aux utilisateurs de proposer et de trouver de l'aide dans leur quartier.

## Fonctionnalités

- Création et gestion de comptes utilisateurs
- Création et recherche de missions d'entraide
- Gestion des associations et des bénévoles
- Système de catégories pour organiser les missions
- Système de notifications et de messagerie

## Installation

1. Clonez le dépôt
```bash
git clone https://github.com/votre-compte/voisin-solidaire.git
cd voisin-solidaire
```

2. Installez les dépendances
```bash
npm install
```

3. Configurez les variables d'environnement
```bash
cp .env.example .env
```
Puis modifiez le fichier `.env` avec vos propres valeurs.

4. Lancez l'application en mode développement
```bash
npm run dev
```

## Tests

### Exécution des tests

Le projet utilise Jest pour les tests unitaires. Pour exécuter les tests :

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests en mode watch
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage
```

### Structure des tests

Les tests sont organisés dans le dossier `src/__tests__` qui reflète la structure du code source :

- `src/__tests__/lib/` : Tests pour les utilitaires
- `src/__tests__/hooks/` : Tests pour les hooks React
- `src/__tests__/components/` : Tests pour les composants React

## Gestion des erreurs

### Architecture de gestion d'erreurs

L'application utilise une architecture de gestion d'erreurs robuste avec :

1. **Utilitaires de gestion des promesses** (`errorHandling.js`)
   - `safePromise` : Wrapper pour les promesses qui retourne un tuple [error, data]
   - `createSafeAsyncHandler` : Crée un gestionnaire d'async/await sécurisé
   - `safeSupabaseCall` : Simplifie les appels à Supabase avec gestion des erreurs

2. **Error Boundaries React** (`ErrorBoundary.jsx`)
   - Capture les erreurs pendant le rendu React
   - Affiche une UI de secours
   - Envoie les erreurs à Sentry

3. **Hook `useErrorHandler`**
   - Simplifie la gestion des erreurs API dans les composants
   - Affiche des messages d'erreur adaptés selon le type d'erreur

### Suivi des erreurs avec Sentry

L'application utilise Sentry pour le suivi et l'analyse des erreurs :

1. **Configuration** dans `.env` :
```
VITE_SENTRY_DSN=https://votre_clé_publique@o123456.ingest.sentry.io/projet_id
```

2. **Fonctionnalités** :
   - Capture automatique des erreurs non gérées
   - Groupement intelligent des erreurs similaires
   - Informations contextuelles sur chaque erreur
   - Filtrage des informations sensibles (PII)

3. **API de Sentry** (`sentry.js`) :
   - `initSentry` : Initialise Sentry avec la configuration appropriée
   - `captureException` : Capture une exception avec contexte
   - `captureMessage` : Enregistre un message avec contexte
   - `setUser` : Associe un utilisateur aux erreurs
   - `safePromiseWithSentry` : Wrapper pour les promesses avec intégration Sentry

## Déploiement

### Construction de l'application

Plusieurs options de build sont disponibles selon vos besoins :

```bash
# Build standard avec Vite
npm run build

# Build complet avec tests, rapports de couverture et analyse des assets
npm run build:full

# Build de production optimisé
npm run build:prod

# Build rapide (sans exécuter les tests)
npm run build:quick

# Build et déploiement sur Netlify
npm run build:netlify

# Build et déploiement sur Vercel
npm run build:vercel
```

Les fichiers générés seront dans le dossier `dist/` prêt à être déployés sur votre hébergeur préféré.

## Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## Licence

[MIT](LICENSE)
