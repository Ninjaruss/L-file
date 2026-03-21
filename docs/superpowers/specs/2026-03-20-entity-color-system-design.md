# Entity Color System Design

**Date:** 2026-03-20
**Status:** Approved

## Problem

Multiple entity types in the Usogui fansite share the same color, making chips, badges, cards, and detail page headers visually indistinguishable:

| Shared Color | Entities |
|---|---|
| Blue `#4dabf7` | Character, Chapter |
| Orange `#f97316` | Arc, Event |
| Purple `#a855f7` | Volume, Media, Organization |
| Green `#51cf66` | Guide, Quote |

Additionally, the Mantine theme (`mantine-theme.ts`) and MUI admin theme (`theme.ts`) each define entity colors independently, creating a risk of drift.

## Goal

Every entity type gets a unique, visually distinct color. A single source of truth file eliminates future theme divergence.

## Entities in Scope

11 entities (Tags and Badges excluded — they use utility/neutral styling):

- Character, Arc, Volume, Chapter, Gamble, Event, Organization, Guide, Media, Quote, Annotation

## Approved Color Map

| Entity | Hex | Description | Hue |
|---|---|---|---|
| Gamble | `#ff3333` | Pure Red | 0° |
| Arc | `#ff7a00` | Vivid Orange | 29° |
| Annotation | `#ffd700` | Gold | 51° |
| Event | `#99dd00` | Chartreuse | 88° |
| Guide | `#22bb55` | Emerald | 141° |
| Organization | `#00ccbb` | Teal | 175° |
| Quote | `#00ccee` | Cyan | 191° |
| Chapter | `#2299ff` | Royal Blue | 214° |
| Character | `#8877ff` | Indigo | 245° |
| Volume | `#dd44ff` | Violet | 288° |
| Media | `#ff3399` | Hot Pink | 330° |

Colors are distributed around the hue wheel for maximum perceptual distinctness, all vibrant enough to read clearly on the app's dark backgrounds (`#0a0f1e`, `#080c14`).

## Architecture

### Approach: Single Source of Truth (Approach B)

**New file: `client/src/lib/entityColors.ts`**

Exports:
- `ENTITY_COLORS` — a const record mapping entity type keys to hex strings
- `getEntityColor(type: EntityAccentKey): string` — safe accessor with fallback

Both theme files import from this file. Any future color change is one edit in one place.

**Updated: `client/src/lib/mantine-theme.ts`**

- The `colors` object (10-step Mantine palettes) — regenerate palettes for the 6 entities that are changing: Annotation, Event, Organization, Quote, Character, Media
- `theme.other.usogui` accent values — replace all 11 hex values with imports from `entityColors.ts`
- Existing `getEntityAccent()` and `getEntityThemeColor()` helpers remain unchanged

**Updated: `client/src/lib/theme.ts`** (MUI admin)

- `palette.usogui` entity color entries replaced to match, importing from `entityColors.ts`

### No Component Changes Required

All components already call `getEntityAccent()` or `getEntityThemeColor()` which read from the Mantine theme. Updating theme values propagates automatically to:
- Detail page header color strips and gradients
- Playing card borders and glows
- Entity chips and badges
- EntityCard inline mentions
- List page badges
- Admin dashboard (via MUI theme)

## Files Changed

| File | Change |
|---|---|
| `client/src/lib/entityColors.ts` | **New** — canonical color map + accessor |
| `client/src/lib/mantine-theme.ts` | Update `colors` palettes + `theme.other.usogui` values |
| `client/src/lib/theme.ts` | Update `palette.usogui` entity color entries |

## Out of Scope

- Tags and Badges — no dedicated entity color needed
- Component layout or structure changes
- CSS custom property layer — over-engineering for current needs
- New color variants (hover, disabled states) — already handled by Mantine's 10-step palette generation
