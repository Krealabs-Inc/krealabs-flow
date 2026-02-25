# CLAUDE.md — KreaLabs Flow

Instructions pour les sessions de développement assisté par IA.

## Contexte projet

KreaLabs Flow est une plateforme de gestion d'activité (SaaS interne) pour l'agence Kréalabs.
Elle gère les devis, factures, clients, projets, contrats et la trésorerie.

**Organisation par défaut** : `DEFAULT_ORG_ID = "ab33997e-aa9b-4fcd-ab56-657971f81e8a"` (hardcodé dans tous les API routes — multi-tenant non implémenté).

## Conventions de code

### API Routes
- Toutes dans `src/app/api/`
- Utiliser les helpers `success()` et `error()` depuis `@/lib/utils/api-response`
- Auth : vérifier avec `getAuthUser()` depuis `@/lib/auth/get-user`
- Format de réponse : `{ data: ... }` pour le succès

### Services
- Logique métier dans `src/lib/services/`
- Nommer en `<entité>.service.ts`

### Schémas DB
- Dans `src/lib/db/schema/`
- Utiliser Drizzle ORM avec `pgTable`
- Après modification schema : `pnpm db:generate` puis `pnpm db:migrate`

### Composants
- UI shadcn/ui dans `src/components/ui/` (ne pas modifier manuellement)
- Composants partagés dans `src/components/shared/`
- Pages dans `src/app/(dashboard)/`

### Dialogs de confirmation
- Utiliser `<ConfirmDialog>` depuis `@/components/shared/confirm-dialog`
- Ne jamais utiliser `window.confirm()` ou `alert()`
- Pattern :
```tsx
const [confirmState, setConfirmState] = useState({
  open: false, title: "", description: "", variant: "default" as const,
  onConfirm: () => {},
})
// Pour ouvrir :
setConfirmState({ open: true, title: "...", description: "...", variant: "destructive", onConfirm: handleDelete })
// Dans le JSX :
<ConfirmDialog {...confirmState} onClose={() => setConfirmState(s => ({ ...s, open: false }))} />
```

### PDF
- Templates dans `src/components/pdf/`
- Rendu côté serveur uniquement (via `/api/pdf/download`)
- Logo : `path.join(process.cwd(), 'public', 'Logo Krealabs.png')`
- Fonts disponibles : Helvetica, Helvetica-Bold, Helvetica-Oblique, Helvetica-BoldOblique

## Design system

- Couleur principale : `#8B89F7` (lavande) → `oklch(0.65 0.15 280)`
- Font : Geist (Next.js intégré)
- Composants : shadcn/ui avec TailwindCSS v4
- Thème clair/sombre supporté via `next-themes`
- Sidebar : couleur brand lavande définie dans `globals.css` sous `--sidebar-primary`

## Stack Docker

```
postgres:5432           — Base de données principale
stack-auth:8102         — Stack Auth API (self-hosted)
stack-auth:8101         — Stack Auth Dashboard
clickhouse:8123         — Requis par Stack Auth
redis:6379              — Cache Stack Auth
supabase-studio:3001    — Interface DB Supabase Studio
supabase-kong:8000      — API Gateway (Studio → meta/rest/auth)
supabase-meta:5555      — postgres-meta (accès direct dev)
mailpit:8025            — Web UI emails de dev
minio:9001              — Console MinIO (stockage Stack Auth)
app:3000                — Next.js
```

Commande pour rebuild + relancer :
```bash
docker compose --env-file .env.local.local up -d --build app
```

## Points d'attention

- `NEXT_PUBLIC_*` vars doivent être des ARG dans le Dockerfile pour être disponibles au build time
- Docker Compose lit `.env` par défaut — toujours utiliser `--env-file .env.local`
- Migrations Drizzle dans `src/lib/db/migrations/` — ne pas modifier manuellement
- Le dossier `public/uploads/` est gitignored (`.gitkeep` inclus)
- Ne jamais commettre `.env.local` (gitignored par `.env*` pattern)
