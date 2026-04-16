# Local Integration Checklist

This checklist is for the current P0 flow:

- login state persists
- library actions return to the workspace
- workspace generation writes real history assets
- history list and detail read from real persisted records

## Env Source Of Truth

Use the repository root `.env.local` as the primary local env file.

The current loading order is:

1. root `.env.local`
2. root `.env`
3. `server/.env.local`
4. `server/.env`

Frontend uses Vite `envDir: ".."` so `client` reads the root env.

Backend reads the same root env first, then falls back to `server/.env`.

Relative `DATABASE_PATH` values are resolved from `server/`. If you define it in the root `.env.local`, prefer `./server/data/app.db` or an absolute path.

## Required Variables

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## Optional Variables

- `CORS_ORIGIN`
- `PORT`
- `DATABASE_PATH`
- `JWT_SECRET`
- `VITE_API_BASE_URL`
- `AICANAPI_BASE_URL`
- `AICANAPI_IMAGE_API_STYLE`
- `AICANAPI_API_KEY`
- `AICANAPI_DOUBAO_IMAGE_MODEL`
- `AICANAPI_DOUBAO_API_KEY`
- `AICANAPI_GEMINI_IMAGE_MODEL`
- `AICANAPI_GEMINI_API_KEY`

## Start Commands

Install dependencies:

```bash
npm install
```

Initialize local fallback storage:

```bash
npm run db:init
```

Start both apps:

```bash
npm run dev
```

Expected local addresses:

- app + api: `http://localhost:3000`

## Real Integration Flow

1. Open `http://localhost:3000/`.
2. Confirm unauthenticated entry stays on the landing page and can enter `/login`.
3. Register or log in with Supabase email/password.
4. Confirm refresh keeps the logged-in state.
5. Open the library and click `Use` on any poster.
6. Confirm the workspace URL carries `posterId` and `source=library`.
7. Generate once in `chat` mode and once in `draw` mode if available.
8. Confirm successful generation redirects to `/history/:id`.
9. Refresh the history detail page and confirm the asset still loads.
10. Go back to `/history` and confirm the new asset appears in the list with the correct mode and status.
11. Open Settings, change the default mode, save, then enter the workspace without a `mode` query.
12. Confirm the workspace defaults to the saved mode.
13. Log out, then log back in and confirm protected route return preserves the full path and query string.

## Quick Troubleshooting

- `/api/profile` returns `401` after Supabase login`: check that `VITE_SUPABASE_*` points to the same project as `SUPABASE_*`.
- History list loads but stays empty`: verify backend can read `generation_records` with the service role key.
- Login works but generation does not persist`: verify `SUPABASE_SERVICE_ROLE_KEY` is present on the server process, not only the client env.
- You need a local fallback instead of Supabase`: unset the `VITE_SUPABASE_*` keys and use the local auth path, while keeping SQLite initialized.
