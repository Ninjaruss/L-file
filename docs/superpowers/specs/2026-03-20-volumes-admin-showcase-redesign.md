# Volumes Admin Dashboard — Showcase Redesign

**Date:** 2026-03-20
**Status:** Approved

## Overview

The volumes admin dashboard needs three improvements:

1. Rename the "Media" tab to "Cover Image" to clarify it holds the volume's main cover/thumbnail.
2. Add a showcase status panel to the "Showcase Images" tab that clearly shows which images are uploaded and what is required.
3. Replace the hardcoded `SHOWCASE_CONFIGURATIONS` in `showcase-config.ts` with a dynamic API fetch so any volume with both showcase images automatically appears on the homepage.

---

## 1. Tab Rename: "Media" → "Cover Image"

**File:** `client/src/components/admin/Volumes.tsx`

The `<Tab label="Media">` becomes `<Tab label="Cover Image">`. Inside, add:

- A section heading: **"Cover Image"**
- A short description: *"The main cover/thumbnail for this volume. Used in volume listings and cards."*

The `EntityDisplayMediaSection` underneath (`usageType="volume_image"`) is unchanged.

---

## 2. Showcase Images Tab — Status Card

**New component:** `client/src/components/admin/VolumeShowcaseStatusCard.tsx`

This component is rendered at the top of the "Showcase Images" tab, above the two `EntityDisplayMediaSection` sections.

### Props

```ts
interface VolumeShowcaseStatusCardProps {
  volumeId: number | string
}
```

### Behaviour

On mount, fetch both showcase image types in parallel using the existing endpoints:

- `GET /volumes/:id/showcase/background` → `null` or a media record
- `GET /volumes/:id/showcase/popout` → `null` or a media record

Derive state:

| hasBackground | hasPopout | State |
|---|---|---|
| false | false | **Not in Showcase** |
| true | false | **Incomplete** |
| false | true | **Incomplete** |
| true | true | **Showcase Ready** |

### Visual states

Each state uses a coloured card with a Lucide icon and a two-item checklist:

- **Not in Showcase** — red border, `XCircle` icon (`#ef4444`), message: *"Both images are required for this volume to appear in the homepage showcase."*
- **Incomplete** — amber border, `AlertTriangle` icon (`#eab308`), message: *"Upload the missing image to enable showcase."*
- **Showcase Ready** — green border, `CheckCircle` icon (`#10b981`), message: *"This volume will appear in the homepage showcase automatically."*

Checklist items show a small `CheckCircle` (green) when the image is present or `XCircle` (red) when missing, alongside the label ("Background Image — uploaded / missing").

### Re-fetch after upload

The status card must re-fetch after the user uploads or deletes an image in either section below it. **Do not modify `EntityDisplayMediaSection`'s interface.** Instead:

1. Add a `refreshCounter: number` state to `VolumeShow`.
2. Pass `refreshCounter` as the `key` prop on `VolumeShowcaseStatusCard` — React will remount and re-fetch whenever the counter increments.
3. Wrap each showcase `EntityDisplayMediaSection` in a thin `<Box>` that renders an `onRefresh` callback via a `useEffect` or a custom `MediaSectionWrapper` that calls `setRefreshCounter(c => c + 1)` on any mutation event — or simply, trigger the increment from a button/manual action pattern if `EntityDisplayMediaSection` fires a mutation notification (check its internal API first). If it fires no such event, use a polling alternative: a `useInterval` inside `VolumeShowcaseStatusCard` that re-checks every 5s while the tab is visible.

The simplest approach that avoids touching `EntityDisplayMediaSection` at all: make `VolumeShowcaseStatusCard` poll the two showcase endpoints on a 5-second interval while mounted. This trades a small amount of network overhead for zero cross-component coupling.

### Section labels

Both showcase sections gain a **"REQUIRED"** badge (red, small caps) next to their heading, replacing the current plain heading:

```
Background Image  [REQUIRED]
Full-width background displayed behind the volume showcase on the homepage.

Popout Image  [REQUIRED]
Foreground character/art image that pops out in the homepage showcase animation.
```

---

## 3. Dynamic Homepage Showcase

### 3a. Backend — new endpoint

**File:** `server/src/modules/volumes/volumes.controller.ts` and `volumes.service.ts`

Add:

```
GET /volumes/showcase-ready
```

Returns all volumes that have **both** an approved `volume_showcase_background` and an approved `volume_showcase_popout` media record. Route must be declared **before** the `/:id` param route to avoid conflicts.

**Response shape:**

```ts
interface ShowcaseReadyVolume {
  volumeId: number
  volumeNumber: number
  backgroundUrl: string
  popoutUrl: string
  title: string  // "Volume {number}"
}
```

**Service implementation sketch:**

```ts
async getShowcaseReadyVolumes(): Promise<ShowcaseReadyVolume[]> {
  // Find volumes that have at least one approved background AND at least one approved popout
  // Join media twice (or use subqueries) filtering by usageType and status='approved'
  // Return the URL of the first/latest approved image of each type per volume
}
```

No new migration needed — uses existing `MediaUsageType` enum values.

### 3b. Frontend — api.ts

Add method to `client/src/lib/api.ts`:

```ts
getShowcaseReadyVolumes(): Promise<ShowcaseReadyVolume[]>
// GET /volumes/showcase-ready
```

Add the `ShowcaseReadyVolume` interface in `client/src/types/index.ts` (it is an API response type, not a display-config type, so it does not belong in `showcase-config.ts`).

### 3c. Frontend — page.tsx

Replace the current multi-step showcase load:

```ts
// BEFORE
const config = getActiveConfiguration()   // hardcoded
const items = await Promise.all(config.volumes.map(...fetch each...))
```

With:

```ts
// AFTER
const items = await api.getShowcaseReadyVolumes()
setShowcaseVolumes(items.map(v => ({
  id: v.volumeId,
  backgroundImage: v.backgroundUrl,
  popoutImage: v.popoutUrl,
  title: v.title,
})))
```

Layout logic is unchanged: `items.length === 1 ? 'single' : 'dual'`.

If the endpoint returns an empty array, the showcase section is hidden (same behaviour as today when no volumes resolve).

### 3d. showcase-config.ts — cleanup

**Keep:**
- `VolumeShowcaseItem` interface
- `ShowcaseAnimations` interface
- `ANIMATION_PRESETS` constant (still used by `DynamicVolumeShowcase`)

**Remove:**
- `ShowcaseConfiguration` interface
- `SHOWCASE_CONFIGURATIONS` array
- `getActiveConfiguration()`
- `getConfigurationById()`
- `setActiveConfiguration()`
- `createShowcaseConfiguration()`
- `buildShowcaseItemFromApiData()`
- `validateShowcaseConfiguration()`

---

## Affected Files

| File | Change |
|---|---|
| `client/src/components/admin/Volumes.tsx` | Rename tab, add cover image description, wire status card |
| `client/src/components/admin/VolumeShowcaseStatusCard.tsx` | **New** — status card component |
| `client/src/lib/showcase-config.ts` | Remove hardcoded configs and management functions |
| `client/src/lib/api.ts` | Add `getShowcaseReadyVolumes()` |
| `client/src/types/index.ts` | Add `ShowcaseReadyVolume` interface |
| `client/src/app/page.tsx` | Replace hardcoded showcase fetch |
| `server/src/modules/volumes/volumes.controller.ts` | Add `GET /volumes/showcase-ready` route |
| `server/src/modules/volumes/volumes.service.ts` | Add `getShowcaseReadyVolumes()` service method |

---

## Out of Scope

- Changes to `DynamicVolumeShowcase.tsx` animation logic
- Any changes to the `volume_image` (cover image) upload flow
- Adding showcase status to the volume list view or show header
