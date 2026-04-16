# MoviePainter Next Full-Stack Starter

Tech stack:

- Frontend runtime: Next.js + React + TypeScript + Tailwind CSS
- API runtime: single Next-based server, reusing the shared server-side business layer
- Current local starter data/auth: SQLite + JWT + bcrypt
- Target data platform: Supabase

Current planning direction:

- Supabase will be the unified platform for backend data, curated poster library management, and all user business data
- Supabase Studio is the current default management surface for运营与数据维护
- `server/src/*` remains the shared backend business layer and local SQLite/Supabase adapter surface

## Development

1. Install dependencies:

```bash
export PATH="$HOME/.local/node/bin:$PATH"
npm install
```

2. Initialize the local SQLite database:

```bash
npm run db:init
```

3. Create a root `.env.local` for real local integration. The client and server now both read from the repository root first.

Required keys:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Optional keys:

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

For ModelGate/AICANAPI image generation, set `AICANAPI_BASE_URL=https://mg.aid.pub/api`,
`AICANAPI_IMAGE_API_STYLE=modelgate`, one shared `AICANAPI_API_KEY`, and the image model names
used by the workspace.

4. Run the unified local development server:

```bash
npm run dev
```

App + API: `http://localhost:3000`

Notes:

- `npm run dev` starts the only local development server on `localhost:3000`
- Frontend pages and `/api` now share the same local port
- The root `.env.local` is the primary local env source for both apps; `server/.env` remains a fallback only
- Frontend code updates use Next dev refresh
- Backend API requests still reuse `server/src/*` and are served from the same local process on port 3000
- Default local fallback SQLite path is `server/data/app.db`
- Relative `DATABASE_PATH` values are resolved from `server/`; if you define it in the root env, prefer `./server/data/app.db` or an absolute path
