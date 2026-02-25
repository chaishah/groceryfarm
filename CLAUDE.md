# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
```

## Architecture

**Stack**: Next.js 14 App Router + TypeScript, Tailwind CSS, Supabase (Postgres + Realtime)

**Access control**: No auth. Each list has a random `share_token` (16-char hex) in its URL. All mutations go through Next.js API routes that validate the token server-side using the Supabase service role key. The Supabase anon key is only used client-side for Realtime subscriptions.

**Data model** (`supabase/schema.sql`):
- `lists`: `id` (uuid), `name`, `share_token` (unique), `created_at`
- `items`: `id`, `list_id` (→ lists), `name`, `qty`, `bought`, `sort_order`, `created_at`
- RLS allows all anon access (token-in-URL is the security boundary)

**Key flows**:
1. Home (`/`) → POST `/api/lists` → redirect to `/list/[token]`
2. List page server-renders via `createServiceClient()`, passes `list` + `initialItems` to `<GroceryList>` client component
3. `GroceryList` subscribes to `postgres_changes` on `items` filtered by `list_id` for live sync
4. All item mutations call `/api/lists/[token]/items/...` which re-validates the token each time

**API routes** (`app/api/lists/`):
- `POST /api/lists` — create list
- `GET /api/lists/[token]` — get list + items
- `POST /api/lists/[token]/items` — add item
- `DELETE /api/lists/[token]/items` — clear bought items
- `PATCH /api/lists/[token]/items/[id]` — update item (bought, name, qty)
- `DELETE /api/lists/[token]/items/[id]` — delete item
- `PATCH /api/lists/[token]/items/reorder` — update sort_order for all items

**Drag-and-drop**: `@dnd-kit/sortable` with touch support. Only active in "All" filter mode. Uses optimistic updates — local state updates immediately, then PATCH to `/reorder`.

**PWA**: `public/manifest.json` + `public/sw.js` registered via `components/ServiceWorkerRegistration.tsx`. Requires `public/icon-192.png` and `public/icon-512.png` (generate at [realfavicongenerator.net](https://realfavicongenerator.net)).

## Env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Setup

1. Create a Supabase project, run `supabase/schema.sql` in the SQL editor
2. Enable Realtime for the `items` table in Supabase dashboard → Database → Replication (or the schema.sql ALTER PUBLICATION line handles it)
3. Copy `.env.example` → `.env.local`, fill in values from Supabase project settings
4. `npm install && npm run dev`

## Vercel deploy

1. Push to GitHub
2. Import repo in Vercel
3. Add the three env vars in Vercel project settings
4. Deploy — Vercel auto-detects Next.js
