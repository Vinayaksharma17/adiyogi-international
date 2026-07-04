# AGENTS.md

## Packages

Two independent Node packages — `backend/` and `frontend/`. Each has its own `package.json`, scripts, and Prettier config.

## Commands

```sh
# Backend (Express + MongoDB)
cd backend && npm run dev     # nodemon auto-reload
               npm start      # production
               npm test       # vitest run (tests/unit/**.test.js, node env)
               npm run test:watch
               npm run test:coverage  # 85%/80%/85%/85% thresholds

# Frontend (React + Vite)
cd frontend && npm run dev    # http://localhost:5173
               npm run build
               npm run lint   # eslint src/
               npm run format # prettier --write "src/**/*.{js,jsx,css}"
               npm test       # vitest run (src/tests/**.test.{js,jsx}, jsdom env)
               npm run test:watch
               npm run test:coverage  # 85%/80%/80%/85% thresholds
```

Frontend tests require `@testing-library/jest-dom` matchers (extended in `src/tests/setup.js`). Both test suites use Vitest with `globals: false` — import everything explicitly.

## Architecture

### Backend (`backend/`)

- **Entrypoint:** `server.js` (not `src/app.js`) — loads dotenv first, connects to MongoDB, seeds system collections, optionally starts WhatsApp service
- **App:** `src/app.js` — Express app setup (cors, compression, rate-limit, routes, WhatsApp endpoints, error handler)
- **Layers:** `routes/` → `controllers/` → `services/` → `repositories/` → Mongoose models
- **Validation:** Zod schemas in `validators/`, applied via `validate` middleware
- **Auth:** Clerk JWT verification via `middleware/auth.middleware.js` (uses `@clerk/clerk-sdk-node`)
- **Env:** `src/config/env.js` validates all env vars with Zod at startup; crashes if missing
- **Image uploads:** ImageKit CDN (`services/imagekit.service.js`), not local Multer
- **Rate limiting:** 200/15min general, 10/15min on order submission

### Frontend (`frontend/`)

- **Routing:** React Router v6, lazy-loaded pages
- **Auth:** Clerk (`@clerk/react`) — `TokenSync` component syncs Clerk JWT to Axios interceptor via `lib/api-client.js`
- **Cart:** React Context (`context/CartContext.jsx`), persisted to localStorage key `adiyogi_cart`
- **HTTP:** Axios instance (`lib/api-client.js`) with base `/api` and Clerk Bearer token; clears token on 401
- **Path alias:** `@/` → `src/` (Vite resolve + jsconfig.json)
- **Styling:** Tailwind CSS with custom colors: navy `#1B3A6B`, champagne `#C9A84C`, ivory `#F7F4EF`; fonts: Playfair Display (display), DM Sans (body), JetBrains Mono (mono)

## Key Quirks

- **Vite proxy vs backend port:** Dev server proxies `/api` to `http://localhost:5001` (check this matches backend `.env` `PORT`)
- **Clerk required in dev:** Both `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` must be set in `backend/.env` or server exits on startup (Zod validation)
- **Soft deletes:** Products and collections use `isActive: false` — never removed from DB
- **System collections:** "New Arrivals" has `isSystem: true`, not deletable
- **Order IDs:** `ADI-XXXX` (zero-padded sequential)
- **WhatsApp session:** Baileys auth stored in `backend/wa_auth/`; up to 5 reconnection retries
- **Invoice PDFs:** Generated with PDFKit, uploaded to ImageKit CDN
- **Docker:** `docker-compose.yml` runs MongoDB 7.0, backend, and nginx-served frontend with health checks
- **Frontend ESLint:** `react/prop-types: off`, `no-console: warn` (allows warn/error), `react-refresh/only-export-components: warn`
- **Prettier width:** backend 100, frontend 90 (both: no semi, single quotes, trailing commas)

## Outdated Content in CLAUDE.md

`CLAUDE.md` references old custom JWT auth (`adiyogi_admin_token`, `POST /api/admin/setup`, first-time admin setup flow). These were replaced by Clerk. Trust the code, not `CLAUDE.md`.
