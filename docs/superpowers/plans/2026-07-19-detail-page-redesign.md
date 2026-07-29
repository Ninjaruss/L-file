# Detail Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the character, gamble, and arc detail pages into the "Case File" dossier direction — distinctive, consistent, strong hierarchy, and no animation jank — by evolving the shared layout components they already use.

**Architecture:** All three pages share `DetailPageHeader`, `CinematicCard`, `RelatedContentSection`, tab styling, and the entity-color system. We evolve that shared layer (hero, a new document-section treatment, a unified record-sheet aside, restyled tabs, calmer motion, a serif name font), then re-wire each `*PageClient.tsx` to the new structure. Character page first as the reference, then gamble and arc inherit by swapping accent color + tab set + stats.

**Tech Stack:** Next.js 15 (App Router, client components), React 19, Mantine 8, `motion/react`, TypeScript, plain CSS in `globals.css`, `next/font/google` for self-hosted fonts.

**Verification method:** This is visual work. Each task is verified by (a) `yarn build` typecheck passing, (b) `yarn lint` clean on touched files, and (c) a **rendered screenshot** of the affected page from the running dev server (frontend `:3000`, backend `:3001`) or headless Chrome. "Done" requires the screenshot to match the intended design — evidence, not assertion. Reference target: the approved mockup and the spec at `docs/superpowers/specs/2026-07-19-detail-page-redesign-design.md`.

**Branch:** `redesign/detail-pages` (already created; spec committed).

---

## File Map

**Create:**
- `client/src/components/layouts/DocSection.tsx` — numbered `§` ruled document-section wrapper for narrative content (replaces per-section `CinematicCard` in main columns).
- `client/src/components/layouts/RecordSheet.tsx` — single bordered aside panel with internal ruled sub-sections (Details rows, related lists, quote).

**Modify:**
- `client/src/app/layout.tsx` — add Playfair Display via `next/font/google`, expose `--font-editorial-serif`.
- `client/src/app/globals.css` — register the serif CSS var; add underlined "file-tab" styling; keep OPTIGoudy for logo only.
- `client/src/lib/motion-presets.ts` — add `calmEnter` (short fade, no invisible resting state).
- `client/src/hooks/useSafeMotion.ts` — ensure reduced-motion path renders the visible end state (it already sets `initial:false`; confirm + document).
- `client/src/components/layouts/DetailPageHeader.tsx` — serif name, `FILE №<id>` tag, entity-type-only eyebrow, suit watermark, dossier stat/tag styling.
- `client/src/app/characters/[id]/CharacterPageClient.tsx` — re-wire Overview to DocSection (main) + RecordSheet (aside); remove `LazySection`/scroll-gating from primary content; use `calmEnter`.
- `client/src/app/gambles/[id]/GamblePageClient.tsx` — port to the same structure.
- `client/src/app/arcs/[id]/ArcPageClient.tsx` — port to the same structure.

**Do NOT touch:** backend, API, routing, spoiler/progress logic, media pipeline, homepage, list pages, submission flows, admin.

---

## Task 1: Add the editorial serif font

**Files:**
- Modify: `client/src/app/layout.tsx`
- Modify: `client/src/app/globals.css:17-19`

- [ ] **Step 1: Import and configure Playfair Display**

In `client/src/app/layout.tsx`, alongside the existing `Noto_Sans` import (line ~2), add:

```tsx
import { Noto_Sans, Playfair_Display } from 'next/font/google'

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-sans-next',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-playfair-next',
})
```

- [ ] **Step 2: Apply the font variable to `<body>`**

In the same file, change the `<body>` className to include both variables:

```tsx
<body className={`${notoSans.variable} ${playfair.variable}`} suppressHydrationWarning>
```

- [ ] **Step 3: Register the semantic CSS variable**

In `client/src/app/globals.css`, in the `:root` block (after line 18–19), add:

```css
  --font-editorial-serif: var(--font-playfair-next), 'Playfair Display', Georgia, serif;
```

- [ ] **Step 4: Verify build + font loads**

Run: `cd client && yarn build`
Expected: build succeeds, no type errors.
Then with dev servers running, load a page and confirm no console errors. (Font is exercised visually in Task 4.)

- [ ] **Step 5: Commit**

```bash
git add client/src/app/layout.tsx client/src/app/globals.css
git commit --no-gpg-sign -m "feat(ui): add self-hosted Playfair Display editorial serif"
```

> Note: git commit signing is routed through 1Password and unavailable in this environment — use `--no-gpg-sign` on every commit in this plan.

---

## Task 2: Add a calm motion preset

**Files:**
- Modify: `client/src/lib/motion-presets.ts`
- Modify: `client/src/hooks/useSafeMotion.ts` (verify only)

- [ ] **Step 1: Add `calmEnter` preset**

In `client/src/lib/motion-presets.ts`, after the `pageEnter` export (line ~20), add:

```ts
/**
 * Calm page entrance — short fade, minimal translate.
 * Resting (initial) state is never fully invisible for long, and the
 * animate state is the visible end state so reduced-motion/no-JS shows content.
 */
export const calmEnter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: easings.standard },
}
```

- [ ] **Step 2: Confirm reduced-motion path is safe**

Open `client/src/hooks/useSafeMotion.ts`. Confirm it returns `{ initial: false, animate: props.animate, transition: { duration: 0 } }` when reduced motion is set (it does). This renders the visible end state instantly. No change needed; if it differs, make it match. Add a one-line comment documenting that `animate` MUST be the visible state.

- [ ] **Step 3: Verify build**

Run: `cd client && yarn build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add client/src/lib/motion-presets.ts client/src/hooks/useSafeMotion.ts
git commit --no-gpg-sign -m "feat(ui): add calmEnter motion preset for detail pages"
```

---

## Task 3: Restyle tabs as underlined "file-tabs"

**Files:**
- Modify: `client/src/app/globals.css:221-324` (and the active-state blocks below through ~line 400)

The current tabs are pill-style (rounded background, glow). Replace with a flat underlined file-tab look: transparent background, entity-accent bottom border on the active tab, muted inactive text. Keep the per-entity accent via the existing `.character-tabs / .gamble-tabs / .arc-tabs` class hooks.

- [ ] **Step 1: Replace the tab list + base + hover + active CSS**

In `client/src/app/globals.css`, replace the block starting at `/* Entity-specific tabs styling ... */` (line 221) through the end of the entity active-state rules with:

```css
/* Entity detail-page tabs — underlined "file-tab" style */
.character-tabs .mantine-Tabs-list,
.gamble-tabs .mantine-Tabs-list,
.arc-tabs .mantine-Tabs-list {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0;
  padding: 0;
  gap: 2px;
}

.character-tabs .mantine-Tabs-tab,
.gamble-tabs .mantine-Tabs-tab,
.arc-tabs .mantine-Tabs-tab {
  color: rgba(255, 255, 255, 0.5) !important;
  background-color: transparent !important;
  border: none !important;
  border-bottom: 2px solid transparent !important;
  border-radius: 0 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  letter-spacing: 0.02em !important;
  padding: 14px 20px !important;
  transition: color 150ms ease, border-color 150ms ease !important;
}

.character-tabs .mantine-Tabs-tab:hover,
.gamble-tabs .mantine-Tabs-tab:hover,
.arc-tabs .mantine-Tabs-tab:hover {
  color: rgba(255, 255, 255, 0.85) !important;
}

/* Active = entity-accent underline. Accent comes from --tab-accent set by setTabAccentColors(). */
.character-tabs .mantine-Tabs-tab[data-active],
.gamble-tabs .mantine-Tabs-tab[data-active],
.arc-tabs .mantine-Tabs-tab[data-active] {
  color: var(--tab-accent, #e11d48) !important;
  background: transparent !important;
  border-bottom: 2px solid var(--tab-accent, #e11d48) !important;
  box-shadow: none !important;
}
```

- [ ] **Step 2: Confirm `setTabAccentColors` sets `--tab-accent`**

Open `client/src/lib/mantine-theme.ts` around line 680 (inside `setTabAccentColors`). Confirm it sets a CSS custom property usable as the accent. If the property it sets is named differently (e.g. `--tab-accent-color`), either rename the CSS references in Step 1 to match, or add `target.style.setProperty('--tab-accent', accentColor)`. The active-tab underline MUST resolve to the entity accent.

- [ ] **Step 3: Verify visually**

With dev servers up, load `http://localhost:3000/characters/1`, screenshot, and confirm: tabs are underlined (not pills), active "Overview" tab shows an amber underline + amber text, inactive tabs are muted grey.

Run: `cd client && yarn lint` — expected: no new errors in `globals.css` scope.

- [ ] **Step 4: Commit**

```bash
git add client/src/app/globals.css client/src/lib/mantine-theme.ts
git commit --no-gpg-sign -m "feat(ui): restyle detail-page tabs as underlined file-tabs"
```

---

## Task 4: Evolve `DetailPageHeader` into the dossier hero

**Files:**
- Modify: `client/src/components/layouts/DetailPageHeader.tsx` (content column ~lines 509–620; add optional `fileNo` + `subtitle` props)

Keep ALL existing behavior (portrait cycling, lightbox, spoiler gating, blurred bg, no-image fallback). Change only the content-column presentation and add a suit watermark.

- [ ] **Step 1: Add optional props**

In the `DetailPageHeaderProps` interface (line ~28), add:

```tsx
  /** Optional real subtitle/alias line (rendered only if provided). */
  subtitle?: string
  /** Show the FILE №<id> dossier tag in the eyebrow row. Default true. */
  showFileTag?: boolean
```

Add to the destructured params (line ~51): `subtitle, showFileTag = true,`.

- [ ] **Step 2: Change the entity name to the editorial serif**

In the `<Title order={1}>` style (line ~530), change:
```tsx
fontFamily: 'var(--font-opti-goudy-text)',
```
to:
```tsx
fontFamily: 'var(--font-editorial-serif)',
fontWeight: 600,
```
(Remove the `fontWeight: 900` on the previous line so 600 applies.)

- [ ] **Step 3: Replace the eyebrow row with FILE tag + entity type**

Replace the eyebrow `<Box>` block (lines ~511–527) with:

```tsx
        {/* Eyebrow row: FILE №<id> tag + entity type */}
        <Box style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {showFileTag && (
            <Box
              style={{
                fontFamily: 'var(--font-noto-sans)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: accentColor,
                border: `1px solid ${accentColor}80`,
                borderRadius: 4,
                padding: '5px 8px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              FILE №{String(entityId).padStart(3, '0')}
            </Box>
          )}
          <Text
            style={{
              fontSize: 10,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#8a8a8a',
              fontWeight: 700,
            }}
          >
            {entityType}
          </Text>
        </Box>
```

- [ ] **Step 4: Add the subtitle line (real data only)**

Immediately after the `<Title>` (name) closing tag (after line ~544), add:

```tsx
        {subtitle && (
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', marginTop: -6, marginBottom: 12 }}>
            {subtitle}
          </Text>
        )}
```

- [ ] **Step 5: Add a suit watermark to the portrait zone**

Inside the outer hero `<Box>` (after the "Bottom fade" decorative Box, ~line 489), add a decorative watermark clipped to the header:

```tsx
      {/* Decorative suit watermark (aria-hidden) */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          right: -30,
          bottom: -70,
          fontFamily: 'var(--font-editorial-serif)',
          fontSize: 260,
          lineHeight: 1,
          color: 'rgba(255,255,255,0.03)',
          zIndex: 1,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        ♠
      </Box>
```

- [ ] **Step 6: Verify visually**

Load `http://localhost:3000/characters/1`, screenshot. Confirm: serif name, amber `FILE №001` tag + `CHARACTER` eyebrow, subtitle if the character has `alternateNames`, faint spade watermark, portrait still cycles and opens lightbox.

Run: `cd client && yarn build` — expected: success.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/layouts/DetailPageHeader.tsx
git commit --no-gpg-sign -m "feat(ui): dossier hero — serif name, FILE tag, suit watermark"
```

---

## Task 5: Create `DocSection` (numbered ruled section)

**Files:**
- Create: `client/src/components/layouts/DocSection.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import React from 'react'
import { Box } from '@mantine/core'

interface DocSectionProps {
  /** Two-digit section number, e.g. "01". */
  no: string
  /** Section title, uppercased in render. */
  title: string
  /** Entity accent color (hex). */
  accent: string
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * Numbered "§" document section with a hairline rule.
 * Narrative content sits directly beneath — no card chrome — so the main
 * column reads as one document instead of a stack of equal cards.
 */
export function DocSection({ no, title, accent, children, style }: DocSectionProps) {
  return (
    <Box component="section" style={{ marginBottom: 40, ...style }}>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <Box
          style={{
            fontFamily: 'var(--font-noto-sans)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: accent,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          §{no}
        </Box>
        <Box
          component="h2"
          style={{
            fontFamily: 'var(--font-noto-sans)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.74)',
            margin: 0,
          }}
        >
          {title}
        </Box>
        <Box aria-hidden style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </Box>
      {children}
    </Box>
  )
}

export default DocSection
```

- [ ] **Step 2: Verify build**

Run: `cd client && yarn build`
Expected: success (component compiles; it's exercised in Task 7).

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layouts/DocSection.tsx
git commit --no-gpg-sign -m "feat(ui): add DocSection document-section wrapper"
```

---

## Task 6: Create `RecordSheet` (unified aside panel)

**Files:**
- Create: `client/src/components/layouts/RecordSheet.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import React from 'react'
import { Box } from '@mantine/core'

/** A key/value detail row. `href` makes the value a link. `valueColor` overrides. */
export interface RecordRow {
  key: string
  value: React.ReactNode
  href?: string
  valueColor?: string
}

interface RecordSheetProps {
  accent: string
  /** Top "Details" rows. */
  details: RecordRow[]
  children?: React.ReactNode
}

/**
 * Single bordered "record sheet" for the detail-page aside.
 * Details rows at top; callers append related-list sub-sections and a quote
 * via <RecordBlock> children so metadata reads as one record, not N cards.
 */
export function RecordSheet({ accent, details, children }: RecordSheetProps) {
  return (
    <Box
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        background: '#101014',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          fontFamily: 'var(--font-noto-sans)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          padding: '16px 18px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Box aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: accent }} />
        Details
      </Box>
      {details.map((row) => (
        <Box
          key={row.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '11px 18px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Box style={{ fontSize: 12, letterSpacing: '0.04em', color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}>
            {row.key}
          </Box>
          <Box style={{ fontSize: 13, fontWeight: 700, color: row.valueColor ?? '#fff', textAlign: 'right' }}>
            {row.value}
          </Box>
        </Box>
      ))}
      {children}
    </Box>
  )
}

interface RecordBlockProps {
  title: string
  children: React.ReactNode
}

/** A titled sub-section inside the RecordSheet (e.g. "Story Arcs", "Gambles"). */
export function RecordBlock({ title, children }: RecordBlockProps) {
  return (
    <Box style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '6px 0 10px' }}>
      <Box
        style={{
          fontFamily: 'var(--font-noto-sans)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          padding: '14px 18px 4px',
        }}
      >
        {title}
      </Box>
      {children}
    </Box>
  )
}

interface RecordLinkProps {
  label: string
  href: string
  /** Small leading dot color (entity color of the linked item). */
  dotColor: string
}

/** A single tappable related-item row inside a RecordBlock. */
export function RecordLink({ label, href, dotColor }: RecordLinkProps) {
  return (
    <Box
      component="a"
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        color: 'rgba(255,255,255,0.74)',
        textDecoration: 'none',
        fontSize: 13.5,
      }}
    >
      <Box style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <Box aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span>{label}</span>
      </Box>
      <span aria-hidden style={{ color: 'rgba(255,255,255,0.38)', fontSize: 15 }}>›</span>
    </Box>
  )
}

export default RecordSheet
```

- [ ] **Step 2: Verify build**

Run: `cd client && yarn build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/layouts/RecordSheet.tsx
git commit --no-gpg-sign -m "feat(ui): add RecordSheet unified aside panel"
```

---

## Task 7: Re-wire the character page (reference implementation)

**Files:**
- Modify: `client/src/app/characters/[id]/CharacterPageClient.tsx`

This is the proving task. Convert the Overview tab: main column uses `DocSection` for Description / Relationships / Organizations (no per-section `CinematicCard`); aside uses one `RecordSheet` (Details rows + `RecordBlock`/`RecordLink` for Story Arcs, Gambles, Quotes). Swap `pageEnter` → `calmEnter`. Remove any `LazySection` wrapping of primary Overview content (none currently in this file, but confirm the content renders eagerly).

- [ ] **Step 1: Update imports**

In `CharacterPageClient.tsx`, add:
```tsx
import { DocSection } from '../../../components/layouts/DocSection'
import { RecordSheet, RecordBlock, RecordLink } from '../../../components/layouts/RecordSheet'
import { calmEnter } from '../../../lib/motion-presets'
```
Remove the now-unused `CinematicCard`/`CinematicSectionHeader` and `RelatedContentSection` imports **only after** Step 3 replaces their usages (leave them until then to keep the file compiling between edits).

- [ ] **Step 2: Pass real subtitle to the header**

Change the `<DetailPageHeader ... />` usage (line ~158) to pass a real alias subtitle when present:
```tsx
        subtitle={character.alternateNames?.length ? character.alternateNames.join(' · ') : undefined}
```
(Add the `Character` interface field if missing — it already declares `alternateNames: string[] | null`.)

- [ ] **Step 3: Replace the Overview panel body**

Replace the Overview `<Tabs.Panel value="overview">` inner grid (lines ~202–350) with:

```tsx
          <Tabs.Panel value="overview" pt={theme.spacing.md}>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 320px',
                gap: 44,
                alignItems: 'start',
              }}
              className="detail-editorial-grid"
            >
              {/* ── Main column: document ── */}
              <Box>
                <DocSection no="01" title="Description" accent={entityColors.character}>
                  {character.description ? (
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.7, fontSize: 16 }}>
                        <EnhancedSpoilerMarkdown
                          content={character.description}
                          enableEntityEmbeds
                          compactEntityCards={false}
                        />
                      </Box>
                    </TimelineSpoilerWrapper>
                  ) : (
                    <Text size="sm" style={{ fontStyle: 'italic', color: `${entityColors.character}55` }}>
                      No description available yet.
                    </Text>
                  )}
                </DocSection>

                {character.backstory && (
                  <DocSection no="02" title="Backstory" accent={entityColors.character}>
                    <TimelineSpoilerWrapper chapterNumber={character.firstAppearanceChapter ?? undefined}>
                      <Box style={{ lineHeight: 1.7, fontSize: 16 }}>
                        <EnhancedSpoilerMarkdown content={character.backstory} enableEntityEmbeds compactEntityCards={false} />
                      </Box>
                    </TimelineSpoilerWrapper>
                  </DocSection>
                )}

                <DocSection no={character.backstory ? '03' : '02'} title="Relationships" accent={entityColors.character}>
                  <CharacterRelationships characterId={character.id} characterName={character.name} />
                </DocSection>

                {character.organizations && character.organizations.length > 0 && (
                  <DocSection no={character.backstory ? '04' : '03'} title="Organizations" accent={entityColors.organization}>
                    <CharacterOrganizationMemberships characterId={character.id} characterName={character.name} />
                  </DocSection>
                )}
              </Box>

              {/* ── Aside: record sheet ── */}
              <RecordSheet
                accent={entityColors.character}
                details={[
                  ...(character.firstAppearanceChapter != null
                    ? [{ key: 'DEBUT', value: `Ch. ${character.firstAppearanceChapter}` }]
                    : []),
                  ...(character.organizations && character.organizations.length > 0
                    ? [{
                        key: 'ORGANIZATION',
                        value: character.organizations[0].name,
                        href: `/organizations/${character.organizations[0].id}`,
                        valueColor: entityColors.organization,
                      }]
                    : []),
                  { key: 'GAMBLES', value: gambles.length },
                  { key: 'ARCS', value: arcs.length },
                ]}
              >
                {arcs.length > 0 && (
                  <RecordBlock title="Story Arcs">
                    {arcs.slice(0, 4).map((arc) => (
                      <RecordLink key={arc.id} label={arc.name} href={`/arcs/${arc.id}`} dotColor={entityColors.arc} />
                    ))}
                  </RecordBlock>
                )}
                {gambles.length > 0 && (
                  <RecordBlock title="Gambles">
                    {gambles.slice(0, 4).map((g) => (
                      <RecordLink key={g.id} label={g.name} href={`/gambles/${g.id}`} dotColor={entityColors.gamble} />
                    ))}
                  </RecordBlock>
                )}
                {quotes && quotes.length > 0 && (
                  <RecordBlock title="Quotes">
                    <Box style={{ padding: '4px 18px 16px' }}>
                      <Box style={{ fontFamily: 'var(--font-editorial-serif)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: '#fff' }}>
                        <span style={{ color: entityColors.quote, fontSize: 22 }}>“</span>
                        {quotes[0].text?.slice(0, 160)}”
                      </Box>
                    </Box>
                  </RecordBlock>
                )}
              </RecordSheet>
            </Box>
          </Tabs.Panel>
```

- [ ] **Step 4: Swap motion + remove dead imports**

Change `<motion.div {...pageEnter}>` (line ~178) to `<motion.div {...calmEnter}>`. Remove the `pageEnter` import and any now-unused `CinematicCard`, `CinematicSectionHeader`, `RelatedContentSection` imports. Keep the `Card`/`Tabs` wrapper as-is.

- [ ] **Step 5: Verify build + lint**

Run: `cd client && yarn build && yarn lint`
Expected: build success; no unused-import or type errors in this file.

- [ ] **Step 6: Verify visually against the mockup**

Load `http://localhost:3000/characters/1`. Screenshot the full page. Confirm against the spec/mockup:
- Hero: serif name, FILE tag, stats, tags, portrait, watermark.
- Underlined tabs, amber active.
- Main column: `§01 Description` etc. as ruled sections, description is prose (no card box), NOT a wall of cards.
- Aside: a single record-sheet panel with Details rows + Story Arcs/Gambles/Quotes blocks + entity-color dots.
- No blank/ghosted regions; content visible on first paint.

Also load `http://localhost:3000/characters/2` (Kaji) to confirm it generalizes.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/characters/[id]/CharacterPageClient.tsx
git commit --no-gpg-sign -m "feat(ui): re-wire character page to dossier layout"
```

---

## Task 8: Port the gamble page

**Files:**
- Modify: `client/src/app/gambles/[id]/GamblePageClient.tsx`

Apply the identical structure with the gamble accent (`entityColors.gamble`, crimson `#e63946`). The gamble page's Overview sections differ (Rules, Participants/Factions, Outcome, Strategy — use whatever sections currently exist in this file); wrap each existing main-column `CinematicCard` narrative section in a `DocSection` instead, and collapse its aside cards into one `RecordSheet`.

- [ ] **Step 1: Read the current gamble sections**

Open `GamblePageClient.tsx`. List its Overview main sections and aside cards (they map 1:1 to the current `CinematicCard`/`RelatedContentSection` usages). Keep the same content and order.

- [ ] **Step 2: Apply the same imports as Task 7 Step 1**

Add `DocSection`, `RecordSheet`/`RecordBlock`/`RecordLink`, `calmEnter`.

- [ ] **Step 3: Convert main column to `DocSection`s**

For each narrative main-column section, replace `<CinematicCard entityColor={entityColors.gamble}><CinematicSectionHeader label="X" .../> ...</CinematicCard>` with `<DocSection no="0N" title="X" accent={entityColors.gamble}> ... </DocSection>`, numbering sequentially. Preserve the inner content (spoiler wrappers, markdown, participant/faction components) exactly.

- [ ] **Step 4: Convert aside to one `RecordSheet`**

Move the gamble's detail fields into `RecordSheet` `details` rows, and its related lists (characters, media, etc.) into `RecordBlock` + `RecordLink` using each item's entity color for the dot. Add a quote block if the page shows quotes.

- [ ] **Step 5: Swap motion + pass `showFileTag`/subtitle**

Change page-enter motion to `calmEnter`. Keep the `DetailPageHeader` — it already themes to `entityType="gamble"`. Pass a real `subtitle` only if the gamble has one.

- [ ] **Step 6: Verify build + lint + visual**

Run: `cd client && yarn build && yarn lint`
Load a real gamble page (find an id via `http://localhost:3000/gambles`), screenshot. Confirm: crimson accent throughout, underlined tabs, document main column, single record sheet, no jank. Confirm it visually matches the character page's *structure* (family resemblance) with only color/section differences.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/gambles/[id]/GamblePageClient.tsx
git commit --no-gpg-sign -m "feat(ui): port gamble page to dossier layout"
```

---

## Task 9: Port the arc page

**Files:**
- Modify: `client/src/app/arcs/[id]/ArcPageClient.tsx`

Identical process to Task 8 with the arc accent (`entityColors.arc`, flame `#ff6b35`).

- [ ] **Step 1: Read current arc sections** — list Overview main sections + aside cards; keep content/order.

- [ ] **Step 2: Add imports** — `DocSection`, `RecordSheet`/`RecordBlock`/`RecordLink`, `calmEnter`.

- [ ] **Step 3: Convert main column** — each narrative `CinematicCard` → `DocSection no="0N" title=... accent={entityColors.arc}`, preserving inner content.

- [ ] **Step 4: Convert aside** — one `RecordSheet` with detail rows + `RecordBlock`/`RecordLink` related lists (per-item entity-color dots) + quote if present.

- [ ] **Step 5: Swap motion** — page-enter → `calmEnter`; real `subtitle` only if present.

- [ ] **Step 6: Verify build + lint + visual**

Run: `cd client && yarn build && yarn lint`
Load a real arc page (id via `http://localhost:3000/arcs`), screenshot. Confirm flame accent, structural family resemblance, no jank.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/arcs/[id]/ArcPageClient.tsx
git commit --no-gpg-sign -m "feat(ui): port arc page to dossier layout"
```

---

## Task 10: Cross-page QA — responsive, a11y, consistency

**Files:**
- Modify: `client/src/app/globals.css` (add responsive rule for `.detail-editorial-grid` if not already present)

- [ ] **Step 1: Responsive grid collapse**

Ensure `.detail-editorial-grid` collapses to one column below 768px. In `globals.css`, add (if not present):

```css
@media (max-width: 768px) {
  .detail-editorial-grid {
    grid-template-columns: 1fr !important;
  }
}
```

- [ ] **Step 2: Mobile screenshots**

With the dev browser at 390px width, screenshot `characters/1`, a gamble, and an arc. Confirm: single column (record sheet drops below main), tabs scroll or wrap, hero stacks readably, no horizontal overflow.

- [ ] **Step 3: Reduced-motion check**

In the browser, emulate `prefers-reduced-motion: reduce`, reload `characters/1`. Confirm the hero + Overview body are fully visible immediately (no invisible/ghosted content) — this is the core jank fix.

- [ ] **Step 4: A11y spot-check**

Confirm exactly one `<h1>` per page (entity name), section titles are `<h2>` (DocSection renders `component="h2"`), and decorative layers (`FILE №`, watermark, rules) are `aria-hidden`. Check amber/crimson/flame label text meets AA at body size on the dark background; lighten a tint if any fails.

- [ ] **Step 5: Consistency pass**

Put all three pages side by side (screenshots). Confirm identical structure, spacing rhythm, and section-header system across character/gamble/arc — only accent color and section content differ.

- [ ] **Step 6: Final build + lint**

Run: `cd client && yarn build && yarn lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add client/src/app/globals.css
git commit --no-gpg-sign -m "feat(ui): responsive + a11y polish for detail pages"
```

---

## Self-Review Notes

- **Spec coverage:** hero (T4), typography/serif (T1, T4), section-header system + document main column (T5, T7–9), record-sheet aside (T6, T7–9), tabs (T3), motion/jank fix (T2, T7–10), per-entity variants (T7 char / T8 gamble / T9 arc), responsive + a11y (T10), content-first/no-flavor (T7 Step 3 renders DB description verbatim; no invented copy anywhere). All spec sections map to tasks.
- **Content-first enforcement:** the only text the components render is real data (name, alias from `alternateNames`, DB description/markdown, counts, related names, real quotes). `FILE №<id>` uses the real entity id; the entity-type eyebrow is a factual label, not flavor.
- **Type consistency:** `DocSection` props (`no`, `title`, `accent`, `children`) and `RecordSheet`/`RecordBlock`/`RecordLink` signatures are used consistently in T7–T9. Entity color access is always `entityColors.<type>` (already built in each PageClient via `getEntityThemeColor`).
- **Open items carried from spec:** serif resolved (Playfair, OFL, self-hosted via next/font — T1). Gamble/arc exact stat trios + section lists are read from the live pages in T8/T9 Step 1 (kept identical to current content). Portrait fallback already handled by existing `DetailPageHeader` no-image branch.
```
