# Key Learnings from This Project

A personal study guide — patterns, decisions, and gotchas from building the Usogui Database. Generated (by Claude Code) based on my changelog and project structure to carry into future projects.

---

## 1. Security Fundamentals

**Never store auth tokens in localStorage.**
Memory-only storage means tokens are gone on page refresh, which is annoying but correct. Tokens in localStorage are readable by any JavaScript on the page, including injected scripts (XSS). The tradeoff is worth it.

**CSRF protection with a custom header.**
Adding `X-Requested-With: Fetch` to every API request is enough to block cross-origin forgery. Browsers can't send arbitrary custom headers cross-origin without triggering a CORS preflight — and if CORS isn't configured for that origin, the request is blocked. This is simple and costs nothing.

**Defense-in-depth for dangerous features.**
The dev-only login bypass checks `NODE_ENV !== 'production'` in three separate places: the guard, the Passport strategy, and the service. This is intentionally redundant. For any feature that would be catastrophic if it leaked into production, check the condition at every layer independently.

**Rate limiting tiers.**
Different limits for different endpoint types: auth routes (50/hour), write operations (50/hour), general reads (2000/15min). Critically: relax the limits significantly in development (e.g. 1000/hour for auth). You will accidentally lock yourself out during testing otherwise, and it wastes time.

**httpOnly cookies for refresh tokens.**
Refresh tokens live in an httpOnly cookie. JavaScript cannot read httpOnly cookies at all — not even your own code. This means even if an attacker injects a script, they can't steal the refresh token. Access tokens (short-lived) stay in memory. This is the correct split.

**Webhook token enforcement.**
The Ko-fi webhook rejects all requests if the verification token env var is not configured. Never silently accept webhook payloads just because the token is missing — that's worse than rejecting them.

---

## 2. Authentication Architecture

**The OAuth2 flow, step by step:**
1. Frontend redirects to backend `/auth/fluxer`
2. Backend redirects to the OAuth provider's authorization URL
3. User approves → provider redirects back to your callback with a `code`
4. Backend exchanges `code` for an access token (server-to-server, never exposed)
5. Backend fetches the user profile from the provider API using that token
6. Backend creates or updates the user in the DB
7. Backend issues your own JWT and refresh token, redirects to frontend with them

**Access token + refresh token split.**
Access tokens are short-lived (1 day), kept in memory. Refresh tokens are long-lived (30 days), httpOnly cookies. When the access token expires, the client silently exchanges the refresh token for a new access token. The user stays logged in indefinitely as long as they return within 30 days.

**The refresh token race condition.**
If two API requests fail with 401 at the same time, both will try to refresh simultaneously — and the second refresh will fail because the first already invalidated the old token. Fix: use a shared promise.

```typescript
if (!this.refreshPromise) {
  this.refreshPromise = this.doRefresh().finally(() => {
    this.refreshPromise = null
  })
}
await this.refreshPromise
// then retry the original request
```

**Bootstrapping the first admin with an env var.**
Setting `ADMIN_FLUXER_ID` in the environment auto-promotes that specific user to admin on login. No admin UI needed for the first admin — you can't have a chicken-and-egg problem if the first admin is defined in config.

**Store only the avatar hash, construct the URL at render time.**
The DB stores `"a1b2c3d4e5f6"` not `"https://cdn.example.com/avatars/123/a1b2c3d4e5f6.png"`. If the CDN URL format ever changes, you update one place in the frontend rather than running a migration over every user row.

---

## 3. NestJS Patterns

**Module per domain.**
Each feature area gets its own module: `characters.module.ts`, `characters.service.ts`, `characters.controller.ts`, plus DTOs and an entity. This keeps things findable and prevents modules from becoming monoliths.

**Guards + custom decorators for role-based access.**

```typescript
// The decorator sets metadata
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)

// The guard reads it
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler())
    // check user.role against required
  }
}

// Usage
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Put(':id')
update() {}
```

Stack guards. `JwtAuthGuard` runs first (rejects unauthenticated), `RolesGuard` runs second (rejects unauthorized). Order matters.

**Response normalization with a global interceptor.**
Write one `TransformResponseInterceptor` that wraps every response in a consistent envelope (`{ data, total, page, perPage, totalPages }`). Apply it globally in `main.ts`. Never do this per-controller — you'll miss some and the client has to handle two shapes.

**Global exception filter for production safety.**
A global filter catches all unhandled exceptions. In development, log everything. In production, strip internal details from the response body — stack traces and DB query errors should never reach clients.

**ValidationPipe configuration that actually works.**

```typescript
app.useGlobalPipes(new ValidationPipe({
  transform: true,          // Converts "42" → 42, "true" → true for query params
  whitelist: true,          // Strips properties not in the DTO
  forbidNonWhitelisted: true, // Returns 400 if unknown properties are sent
}))
```

Without `transform: true`, all query string values are strings. Without `whitelist`, clients can send extra junk. Without `forbidNonWhitelisted`, they get silently stripped and the client has no idea.

**Swagger enum params need `type: 'string'` explicitly.**
When using `@ApiQuery({ enum: MyEnum })` or `@ApiParam({ enum: MyEnum })`, add `type: 'string'` too. Without it, Swagger UI crashes trying to render the schema. This bit us repeatedly.

---

## 4. TypeORM & Database Patterns

**Circular dependency prevention with `import type`.**
Two entities that reference each other (e.g. `Gamble` ↔ `GambleFaction`) will cause "cannot access before initialization" errors at runtime if you use regular imports in both. Fix: use `import type` (type-only, zero runtime cost) in one direction.

```typescript
// gamble.entity.ts
import type { GambleFaction } from './gamble-faction.entity'  // ← type only
@OneToMany(() => GambleFaction, (f) => f.gamble)
factions?: GambleFaction[]
```

The lazy arrow functions in TypeORM decorators (`() => GambleFaction`) are evaluated at runtime, by which point both modules are loaded. This is why it works.

**Polymorphic ownership over multiple join tables.**
Instead of `character_images`, `arc_images`, `guide_images` tables (8 separate tables), use one `media` table with `ownerType` and `ownerId` columns:

```typescript
@Index(['ownerType', 'ownerId'])
class Media {
  ownerType: MediaOwnerType  // 'character' | 'arc' | 'guide' | ...
  ownerId: number
}
```

Pros: one table to query, one place to add columns, easy to add new owner types. Cons: no foreign key enforcement at the DB level. For content databases, this tradeoff is usually worth it.

**Composite indexes for common query patterns.**
Index the columns you actually filter on together. If you always query `WHERE ownerType = ? AND ownerId = ?`, a composite index on `(ownerType, ownerId)` is much faster than two separate indexes.

**Correlated EXISTS subquery over join + deduplicate.**
When filtering "characters that appeared in arc X" through a many-to-many relationship, a correlated subquery is often cleaner and faster than a join:

```sql
WHERE EXISTS (
  SELECT 1 FROM event e
  INNER JOIN event_characters_character ecc ON ecc."eventId" = e.id
  WHERE ecc."characterId" = character.id AND e."arcId" = :arcId
)
```

This avoids duplicating character rows and is directly expressible in TypeORM's query builder with `.andWhere(subquery)`.

**Timestamp-based migration filenames.**
Use Unix timestamps: `1740000000000-AddFluxerFields.ts`. Sequential numbers (`001-`, `002-`) cause collisions when two people create migrations on separate branches. Timestamps don't.

**ENABLE_SCHEMA_SYNC only in development.**
TypeORM's `synchronize: true` auto-applies schema changes by diffing your entities against the DB. It can drop columns. Gate it behind an env var and print a warning in the logs if it's on. Never enable it in production.

**Batch operations in seeders.**
Inserting 500 records one at a time = 500+ queries. Chunking into batches of 100 with `Promise.all` = 5-10 queries. The seeder went from minutes to seconds. Always batch.

---

## 5. Next.js App Router Patterns

**Server components for data-heavy pages.**
Fetch data in the server component with ISR revalidation:

```typescript
const res = await fetch(`${API_URL}/characters/${id}`, {
  next: { revalidate: 300 }  // Cache for 5 minutes, rebuild in background
})
```

No client-side waterfall, no loading spinners for the main content, and the HTML is pre-rendered for SEO.

**Dynamic metadata from the same fetch.**
`generateMetadata()` runs server-side and can use the same data fetch. Return `{ title, description, openGraph }` from it. The data fetch will be deduplicated by Next.js cache — you're not fetching twice.

**Server shell + client island pattern.**
Server component renders the static layout. It dynamically imports the client component that handles interaction:

```typescript
// page.tsx (server)
const CharacterPageClient = dynamic(() => import('./CharacterPageClient'))

export default async function Page({ params }) {
  const character = await fetchCharacter(params.id)
  return <CharacterPageClient character={character} />
}
```

The client component uses `'use client'`, manages tabs/modals/favorites. Server component never needs re-rendering for interactions.

**Use `notFound()` for 404s, not a redirect.**
If the API returns 404 for an entity, call `notFound()` directly in the server component. Next.js will render the nearest `not-found.tsx`. A redirect to `/404` is the wrong pattern in App Router.

**Image loading priority.**
Only add the `priority` prop to images visible on initial load (hero images, above-the-fold). Everything else should lazy load. Also add `<link rel="preconnect">` for your CDN and font origins in the document head — this starts the connection earlier and reduces latency.

---

## 6. API Client Design

**Centralize all API calls.**
One `api.ts` file/class that all components and hooks go through. No ad-hoc `fetch()` calls scattered across the codebase. Benefits: consistent error handling, easy to add auth headers, one place to add logging or retries.

**Standardize your error type.**

```typescript
class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public url: string,
    public method: string,
  ) { super(message) }
}
```

When you catch errors in components, you can `instanceof APIError` check and handle 401, 403, 404 specifically. Generic `Error` objects don't give you the status code.

**Request timeout on every fetch.**

```typescript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30_000)
const res = await fetch(url, { signal: controller.signal })
clearTimeout(timeout)
```

Without this, a hung server can leave your frontend waiting indefinitely. 30 seconds is a reasonable default.

**The refresh token race condition (again, it's important).**
If the user has two tabs open and both make authenticated requests at the same time when the access token has just expired, both get 401, both try to refresh. The second refresh fails because the first already consumed the old refresh token. Use a shared promise singleton to serialize refreshes.

---

## 7. Storage & Media

**Use the S3-compatible API; don't lock in to a provider.**
Cloudflare R2 accepts requests via the AWS SDK. So does MinIO, Backblaze B2 (v2 API), and actual AWS S3. Write your storage service against the S3 interface, and switching providers is just changing credentials and endpoint URL. We switched from B2 to R2 and the code barely changed.

**Retry with exponential backoff on uploads.**
Storage uploads fail on transient network issues. Retry 3 times with increasing delays (1s, 2s, 4s) before giving up. Only retry on 5xx errors, timeouts, and network failures — not 4xx (those are your fault, retrying won't help).

**Convert images to WebP before storing.**
WebP is 25-35% smaller than JPEG/PNG at equivalent quality. Browser support is effectively universal. Doing conversion server-side (with Sharp) means you control quality and clients always get WebP regardless of what they uploaded.

**Organize storage by purpose.**
```
media/character_image/{uuid}.webp
media/gallery_upload/{uuid}.webp
media/volume_showcase/{uuid}.webp
```
When you need to clean up orphaned files or estimate storage by feature, this makes it tractable.

---

## 8. Deployment (Self-Hosting)

**Don't build Next.js on your VPS.**
Next.js builds are memory-hungry. A small VPS (2-4GB RAM) will struggle or fail. Build the Docker image in GitHub Actions and push it to GitHub Container Registry (GHCR). The server pulls the pre-built image. This is how the frontend CI is set up here.

**Backend can build on the server.**
NestJS builds are much lighter than Next.js builds. Dokploy building the backend directly from source is fine.

**`NEXT_PUBLIC_*` env vars bake into the bundle at build time.**
If you need `NEXT_PUBLIC_API_URL` in the frontend, it must be set during the build (as a GitHub Actions secret), not as a server environment variable at runtime. This catches people off guard. Regular (non-public) env vars work the normal way.

**Traefik + Dokploy routing.**
Both services join an external Docker network (`dokploy-network`). Traefik reads labels on the containers and routes traffic by hostname. You don't configure Nginx manually — Traefik handles TLS and routing declaratively.

**SWC builds flatten the output directory.**
SWC (the Rust-based TypeScript compiler) compiles NestJS faster than `tsc`, but it outputs everything flat to `dist/` rather than mirroring the `src/` subdirectory structure. Update your entry point path in `package.json` from `dist/src/main.js` to `dist/main.js`.

---

## 9. General Engineering Habits

**Build an audit trail from the start.**
An `EditLog` entity with `entityType`, `entityId`, `action`, `changedFields` (jsonb), and `userId` costs almost nothing to add early and is very painful to retrofit later. You'll want to know who changed what and when.

**Always enforce pagination limits.**

```typescript
@Max(100)
@Min(1)
limit?: number = 20
```

Without a max, a client can request 10,000 rows and you'll have a bad day. This is a one-liner with class-validator.

**Soft-delete via status enums, not a boolean.**
`status: 'pending' | 'approved' | 'rejected'` is more expressive than `isDeleted: boolean`. It models the actual states the content can be in (especially for moderation workflows) and makes queries readable: `WHERE status = 'approved'` vs `WHERE isDeleted = false AND isApproved = true`.

**Validate env vars at startup; fail fast.**
If a required env var is missing, throw an error during application bootstrap before anything else runs. Don't let the app start in a broken state where it fails silently on the first request that needs the missing value.

**Design spoiler protection early.**
Filtering search results based on reading progress touches the query layer across many entity types. Adding it after the fact means modifying a lot of queries. If your app has any concept of "user shouldn't see X until they reach Y", decide the data model for that before you have 20 list endpoints.
