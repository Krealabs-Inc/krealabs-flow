# KreaLabs Flow

Plateforme de gestion d'activité pour Kréalabs — devis, factures, clients, projets, contrats et trésorerie.

## Stack technique

- **Framework** : Next.js 15 (App Router, TypeScript)
- **UI** : TailwindCSS v4 + shadcn/ui
- **ORM** : Drizzle ORM + PostgreSQL
- **Auth** : Stack Auth (self-hosted)
- **PDF** : @react-pdf/renderer
- **Infra** : Docker Compose

## Prérequis

- Node.js 20+
- pnpm
- Docker + Docker Compose

## Installation

```bash
# Cloner le repo
git clone <repo-url>
cd krealabs-flow

# Copier et remplir les variables d'environnement
cp .env.local.example .env.local.local

# Installer les dépendances
pnpm install
```

## Développement local (sans Docker)

```bash
# Démarrer PostgreSQL en local ou pointer sur une base existante dans .env.local.local
pnpm db:push        # Appliquer le schéma
pnpm dev            # Lancer le serveur de dev sur http://localhost:3000
```

## Développement avec Docker

```bash
# Démarrer tous les services (app + postgres + Stack Auth + ClickHouse + Supabase Studio)
docker compose --env-file .env.local.local up -d

# Rebuild l'image app après des changements de code
docker compose --env-file .env.local.local up -d --build app
```

Services disponibles :
| Service | URL |
|---|---|
| Application | http://localhost:3000 |
| Stack Auth Dashboard | http://localhost:8101 |
| Stack Auth API | http://localhost:8102 |
| Supabase Studio | http://localhost:3001 |

## Variables d'environnement

Voir `.env.example` pour la liste complète avec instructions.

Variables clés :
- `DATABASE_URL` — Connexion PostgreSQL
- `NEXT_PUBLIC_STACK_PROJECT_ID` — ID du projet Stack Auth
- `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` — Clé publique Stack Auth
- `STACK_SECRET_SERVER_KEY` — Clé secrète Stack Auth (server-side uniquement)

## Structure du projet

```
src/
├── app/
│   ├── (dashboard)/          # Pages protégées (layout avec sidebar)
│   │   ├── clients/          # Gestion des clients
│   │   ├── contracts/        # Contrats
│   │   ├── invoices/         # Factures (acompte, solde, avoir)
│   │   ├── payments/         # Paiements
│   │   ├── projects/         # Projets
│   │   ├── quotes/           # Devis
│   │   ├── settings/         # Paramètres organisation
│   │   ├── error.tsx         # Error boundary
│   │   └── loading.tsx       # Skeleton de chargement
│   ├── api/                  # Routes API
│   │   ├── clients/
│   │   ├── contracts/
│   │   ├── dashboard/
│   │   ├── invoices/
│   │   ├── organizations/    # CRUD organisation (settings)
│   │   ├── payments/
│   │   ├── pdf/              # Génération PDF
│   │   ├── projects/
│   │   └── quotes/
│   ├── handler/              # Pages auth Stack Auth
│   ├── globals.css
│   ├── layout.tsx
│   └── not-found.tsx         # Page 404
├── components/
│   ├── layout/               # Header, Sidebar
│   ├── pdf/                  # Templates PDF (devis, factures)
│   ├── shared/               # ConfirmDialog, WorkflowTracker
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── ui/                   # Composants shadcn/ui
├── lib/
│   ├── auth/                 # Configuration Stack Auth
│   ├── db/
│   │   ├── migrations/       # Migrations Drizzle
│   │   └── schema/           # Schémas des tables
│   ├── services/             # Logique métier (invoice, quote, pdf...)
│   └── utils/                # Helpers (api-response, format...)
├── middleware.ts              # Protection des routes auth
public/
├── Logo Krealabs.png          # Logo fond lavande (pour les PDFs)
├── logo.png                   # Logo blanc transparent (sidebar)
└── uploads/                   # Fichiers uploadés (gitignored)
```

## Scripts

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm start        # Serveur de production
pnpm lint         # ESLint
pnpm db:generate  # Générer les migrations Drizzle
pnpm db:push      # Appliquer le schéma sans migration
pnpm db:migrate   # Appliquer les migrations
pnpm db:studio    # Drizzle Studio (UI base de données)
```

## Modules

| Module | Fonctionnalités |
|---|---|
| **Clients** | CRUD, informations légales (SIRET, TVA), contacts |
| **Devis** | Création, lignes détaillées, options, PDF téléchargeable, conversion en facture |
| **Factures** | Acompte / solde / standard / avoir, workflow de paiement, PDF |
| **Paiements** | Suivi des règlements, remboursements |
| **Contrats** | Gestion des contrats, résiliation |
| **Projets** | Suivi de projets, liaison clients |
| **Trésorerie** | Vue consolidée des flux financiers |
| **Settings** | Informations organisation, coordonnées bancaires, mentions légales |

## PDF

Les templates PDF sont dans `src/components/pdf/` et utilisent `@react-pdf/renderer`. Ils sont générés côté serveur via `/api/pdf/download`.

Le logo `public/Logo Krealabs.png` est chargé via le chemin système (`process.cwd()`).

## Auth

L'authentification est gérée par Stack Auth. En self-hosted, Stack Auth nécessite ClickHouse (voir `docker-compose.yml`).

Le middleware `src/middleware.ts` protège toutes les routes sous `/(dashboard)`.
