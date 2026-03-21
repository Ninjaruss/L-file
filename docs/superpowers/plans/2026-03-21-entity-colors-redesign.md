# Entity Color Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 11 spectral entity accent colors in `entityColors.ts` with semantically motivated values approved in the design spec.

**Architecture:** Single file edit — `entityColors.ts` is the sole source of truth. All 11 downstream consumers (Mantine theme, MUI admin theme, page clients, component files) import from it and will reflect the change automatically without modification.

**Tech Stack:** TypeScript, Next.js 15 (client-side constants only — no runtime logic changes)

---

## File Map

| Action | File | What changes |
|--------|------|------|
| Modify | `client/src/lib/entityColors.ts` | 11 hex values only — no structural changes |

No other files need to be touched.

---

### Task 1: Update entity color values

**Files:**
- Modify: `client/src/lib/entityColors.ts`

- [ ] **Step 1: Open the file and verify current state**

  Read `client/src/lib/entityColors.ts`. Confirm it has the 11 keys:
  `gamble, arc, annotation, event, guide, organization, quote, chapter, character, volume, media`

- [ ] **Step 2: Replace all 11 hex values**

  Replace the `ENTITY_COLORS` constant body with:

  ```ts
  export const ENTITY_COLORS = {
    gamble:       '#e63946', // Crimson        — danger, blood, high stakes
    arc:          '#ff6b35', // Flame Orange   — epic narrative fire, adventure
    annotation:   '#9333ea', // Bright Purple  — scholarly, analytical
    event:        '#ca8a04', // Ochre          — momentous, historical, marked in time
    guide:        '#16a34a', // Forest Green   — helpful, educational, community
    organization: '#0369a1', // Deep Ocean     — cold, institutional power
    quote:        '#0d9488', // Dark Teal      — voice, dialogue, spoken word
    chapter:      '#38bdf8', // Sky Blue       — crisp, readable, fresh pages
    character:    '#f5a623', // Amber Gold     — warmth, humanity, spotlight
    volume:       '#6d28d9', // Deep Violet    — weighty tomes, gravitas
    media:        '#db2777', // Hot Pink       — creative, expressive, fan art
  } as const
  ```

  Keep the key order identical to the original file (gamble, arc, annotation, event, guide, organization, quote, chapter, character, volume, media) to minimize diff noise.

- [ ] **Step 3: Verify TypeScript compiles**

  ```bash
  cd client && yarn build 2>&1 | tail -20
  ```

  Expected: build completes with no type errors. (Color values are `string` constants — no type issues expected.)

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/lib/entityColors.ts
  git commit -m "feat: replace spectral entity colors with semantic palette"
  ```

---

### Task 2: Visual spot-check

- [ ] **Step 1: Start dev server**

  ```bash
  cd client && yarn dev
  ```

- [ ] **Step 2: Check a character page**

  Open `http://localhost:3000/characters/[any-id]` and confirm the character accent color is warm amber gold (not indigo).

- [ ] **Step 3: Check a gamble page**

  Open `http://localhost:3000/gambles/[any-id]` and confirm the gamble accent is crimson red.

- [ ] **Step 4: Check the admin panel**

  Open `http://localhost:3000/admin` and confirm entity colors in the sidebar/chips reflect the new palette.

- [ ] **Step 5: Done**

  No further commits needed — visual verification only.
