This repository contains a Next.js frontend and a NestJS backend. The goal of these instructions is to give an AI coding agent the exact, actionable context needed to make safe, correct, and useful code changes quickly.

High-level architecture
- Frontend: `client/` — Next.js (App Router) + React + TypeScript. Admin UI uses react-admin. Data access is via `client/src/lib/api/customDataProvider.ts` which wraps `ra-data-json-server`, converts snake_case <> camelCase, injects Authorization header, and expects the canonical paginated response shape. Public pages fetch from the same API via `client/src/lib/api/*` helper functions.
- Backend: `server/` — NestJS + TypeORM. Auth uses passport-local + passport-jwt. Access tokens are JWTs stored in localStorage; refresh tokens are server-persisted and sent as httpOnly cookies.

Important files and what they do
- server/src/main.ts — app bootstrap. CORS is configured here and the global `TransformResponseInterceptor` is registered. Rate-limiter and cookie-parser live here.
- server/src/common/interceptors/transform-response.interceptor.ts — central normalization for list/paginated responses; sets `X-Total-Count` and ensures the canonical paginated shape `{ data, total, page, totalPages }`. If you change response envelopes, update this file and the client `customDataProvider` in tandem.
- server/src/modules/auth/* — login, refresh, logout, and helpers. `auth.service.ts` issues access tokens and creates/persists refresh tokens. `auth.controller.ts` sets httpOnly refresh cookie on login and clears it on logout.
- server/src/modules/guides/* and server/src/modules/gambles/* — examples of paginated endpoints that should return the canonical shape. Use these as templates when adding new list endpoints.
- server/src/modules/users/* — admin-only users endpoints. Controllers should return the canonical top-level paginated shape `{ data, total, page, totalPages }`. The global `TransformResponseInterceptor` enforces and normalizes responses to that contract.
- client/src/lib/api/customDataProvider.ts — react-admin DataProvider adapter; converts keys, injects Authorization, retries a refresh once on 401, and expects the canonical paginated response shape. If you change any server response envelope, update this file to match.
- client/src/lib/api/authProvider.ts — react-admin AuthProvider. Manages login, logout, checkAuth, tryRefresh, getIdentity and uses localStorage keys `authToken` and `authUser`.

Project-specific conventions and patterns
- Response envelope: canonical paginated response is a top-level object with `{ data: T[], total: number, page: number, perPage?: number, totalPages?: number }`. The server and client enforce this contract. If you change the shape, update both `TransformResponseInterceptor` and `client/src/lib/api/customDataProvider.ts` together.
- Keys casing: Backend uses snake_case for DB and DTOs; frontend uses camelCase. Use `convertKeysToSnakeCase` and `convertKeysToCamelCase` in `customDataProvider` when passing data across the wire.
- Auth contract: POST `/auth/login` sets an httpOnly `refreshToken` cookie and returns `{ access_token, user }`. POST `/auth/refresh` expects the cookie and returns `{ access_token, user }`. GET `/auth/me` returns the user when a valid Authorization header is provided.
- Admin UI: react-admin expects `X-Total-Count` header on list responses, or a JSON body `total`. The server sets and exposes `X-Total-Count` in the interceptor and CORS config — keep both in sync if you modify headers.

Developer workflows (quick commands)
- Backend:
  - dev: cd server && yarn start:dev
  - build/typecheck: cd server && yarn build
  - tests: cd server && yarn test (if/when tests exist)
- Frontend:
  - dev: cd client && yarn dev
  - build: cd client && yarn build
  - lint: cd client && yarn lint

Common gotchas and debugging tips
- Missing X-Total-Count in browser: ensure both `server/src/main.ts` CORS `exposedHeaders` includes `X-Total-Count` and the `TransformResponseInterceptor` sets that header. Browsers only expose headers listed in `Access-Control-Expose-Headers`.
 - React-admin pagination failing: check that the DataProvider returns `{ data: [...], total: number }` or the response includes `X-Total-Count`. `customDataProvider.getList` prefers the top-level `total` field, then the `X-Total-Count` header, or array length as a last resort.
- Auth refresh flow: frontend calls `/auth/refresh` with `credentials: 'include'`. The server must set the httpOnly refresh cookie on login (see `auth.controller.ts`). If users are getting redirected back to login after a successful public-login, ensure `authProvider.getIdentity` rehydrates `authUser` from `/auth/me` or from the refresh response.

How to extend things safely
- Adding new paginated endpoints: implement service methods to return `{ data, total, page, totalPages }` and let controllers return that object. Don't rely on automatic array responses for admin resources.
- Changing response shapes: update `TransformResponseInterceptor` and `client/src/lib/api/customDataProvider.ts` in tandem. Add tests or a smoke curl to verify `X-Total-Count` and body.total behavior.
- Adding new admin resources: create server endpoints following the `guides` or `gambles` patterns, then add react-admin `Resource` entry in `client/src/app/admin/AdminApp.tsx` and a small `List` component under `client/src/app/admin/<resource>/`.

Files to reference when modifying behavior
- server/src/main.ts
- server/src/common/interceptors/transform-response.interceptor.ts
- server/src/modules/auth/*
- server/src/modules/guides/* and server/src/modules/gambles/*
- client/src/lib/api/customDataProvider.ts
- client/src/lib/api/authProvider.ts
- client/src/app/admin/AdminApp.tsx and components under `client/src/app/admin/*`

If something here is missing or misleading, open an issue or ask for clarification in the PR description. When in doubt, run the server and client locally and reproduce the flow end-to-end (login -> /auth/refresh -> admin list) before changing cross-cutting code like auth or response envelopes.

Please review these instructions and tell me any gaps you'd like filled (examples, workflows, or recorded terminal commands you use locally). I will iterate on this file.
## Quick orientation

This repository is a two-app setup: a Next.js TypeScript front-end in `client/` and a NestJS TypeScript API server in `server/`.
AI code changes should respect the client/server boundary: UI, react-admin and browser-only code live in `client/`; API, entities, migrations and DB logic live in `server/`.

## Essential patterns & where to look
- Client: `client/src/app` (Next App Router pages), `client/src/components`, `client/src/lib/api/*`, `client/src/types/resources.ts`.
- Server: `server/src/modules`, `server/src/entities`, `server/src/database/*`, `server/typeorm.config.ts`.

Key project rules the agent must follow:
- Lists return the paginated envelope { data, total, page, totalPages } — front-end API helpers expect `PaginatedResponse<T>` in `client/src/lib/api/types.ts`.
- Any file importing from `react-admin` must be a client component: add `"use client";` as the very first line.
- React-admin is loaded client-side via `AdminClient` / `AdminClientWrapper` in `client/src/components` to avoid SSR document/window errors.
- Frontend API helpers live under `client/src/lib/api/*` and are the canonical place to change request shapes.

## Concrete rules for edits
- When changing list endpoints or data shapes, update both server controller/DTO and the corresponding client helper in `client/src/lib/api/<resource>.ts` so the shape remains the envelope above.
- When adding or editing any component that uses hooks (useState/useEffect) or browser globals, add `"use client";` at file top. Example: add to `client/src/app/admin/factions/FactionList.tsx`.
- Use the resource type definitions in `client/src/types/resources.ts` for client changes to field names and shapes (create/edit forms must match these types).
- Prefer dynamic import with `dynamic(..., { ssr: false })` for big third-party UI (react-admin) or wrap it in a small client-only component.

## Typical developer workflows (commands)
- Client build & check: cd client && yarn build
- Client dev: cd client && yarn dev
- Server dev: cd server && yarn start:dev  (or `yarn start:dev` from repo root if script exists)
- DB / migrations: see `server/README.md` and `server/.github/copilot-instructions.md` (use `yarn db:generate`, `yarn db:migrate`, `yarn db:seed` in `server/`).

## Code-gen / safety checks an AI should run after edits
- Run `cd client && yarn build` to catch App Router/TS/ESLint issues (missing `"use client"` or hook violations are common).
- If you changed server types or entities, run the migration generator and inspect SQL: `cd server && yarn db:generate <name>`.

## Examples (copy/paste friendly)
- Make a react-admin list a client component:
	- at top of file: `"use client";`
	- export const FactionList = () => (<List>...</List>);
- Return paginated envelope from an API helper:
	- `const res = await fetch(`${API_URL}/factions?page=${page}`); const body = await res.json() as PaginatedResponse<Faction>; return body;`

## When to ask for clarification
- If a change touches both `server/src/entities` and `client/src/lib/api` and you can't find a matching DTO/mapper, ask which side is authoritative.
- If a runtime error mentions React hooks in server components, ensure `"use client";` is present on any file importing `react-admin`.

## Where to look for more context
- Admin composition: `client/src/components/AdminClient.tsx` and `client/src/components/AdminClientWrapper.tsx`.
- API envelope types: `client/src/lib/api/types.ts`.
- Resource shapes: `client/src/types/resources.ts`.
- Server entities and translations: `server/src/entities/` and `server/src/entities/translations/`.
- Server DB/migration helpers and scripts: `server/scripts/`, `server/typeorm.config.ts`.


See also:
- `client/.github/copilot-instructions.md` — client-specific rules (Next.js, react-admin, App Router specifics).
- `server/.github/copilot-instructions.md` — server-specific rules (NestJS, TypeORM, migrations) — already present.

Please review and tell me if you want this trimmed, expanded with more examples, or merged with the server-level instructions in `server/.github/copilot-instructions.md`.

