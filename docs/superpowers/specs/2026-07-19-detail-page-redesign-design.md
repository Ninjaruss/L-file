# Detail Page Redesign — Character / Gamble / Arc

**Date:** 2026-07-19
**Status:** Approved direction, pending spec review
**Scope:** The three core content detail pages — character, gamble, arc — and the shared layout components they rely on.

---

## 1. Problem

The core content detail pages are the heart of the database — they're what fans come for — but they under-deliver on quality in four specific ways (owner's words):

1. **Generic / not distinctive.** The pages read as "dark theme + accent color + Mantine defaults." Nothing signals *Usogui* or *L-File* specifically.
2. **Inconsistent.** Pages feel uneven even though (see §2) they share components. The unevenness is in visual execution — spacing, section treatment, density — not structure.
3. **Weak hierarchy.** Every section is rendered as an equally-weighted `CinematicCard`. The result is a "wall of cards" with no clear primary/secondary reading order.
4. **Janky / slow.** Staggered `opacity: 0 → 1` reveal chains plus scroll-gated `LazySection`s leave large regions blank or ghosted until intersection fires. On the live site this manifests as a near-black hero above the fold and content that pops in late. It reads as slow and unpolished.

## 2. Current architecture (what we're building on)

This is a redesign of *execution*, not a rewrite. All three pages already share a common shell:

- `src/app/{characters,gambles,arcs}/[id]/*PageClient.tsx` — page composition (tabs, section order).
- `src/components/layouts/DetailPageHeader.tsx` — 280px hero banner: portrait media cycling + lightbox, entity-accent eyebrow, name (currently OPTIGoudy 900), stats row, tags.
- `src/components/layouts/CinematicCard.tsx` + `CinematicSectionHeader` — the per-section card wrapper used everywhere.
- `src/components/layouts/RelatedContentSection.tsx` — compact related-item lists (arcs, gambles, quotes).
- `src/components/Breadcrumb.tsx` — `BreadcrumbNav` + `createEntityBreadcrumbs`.
- Entity color system — `src/lib/entityColors.ts` (single source of truth) → `getEntityThemeColor`. Character = amber `#f5a623`, gamble = crimson `#e63946`, arc = flame `#ff6b35`. Brand red = `#e11d48`.
- Motion — `useSafeMotion`, `motion-presets.ts` (`pageEnter`), `LazySection`.

Because the three pages already use the *same* components, a change to the shared layer propagates to all three. This is the leverage point.

## 3. Direction: "The Case File"

Chosen direction (owner-approved): **treat "L-File" literally as a classified dossier**, with a cinematic hero borrowing atmosphere from the gambling-drama direction.

The organizing metaphor gives us a distinctive, *reusable* visual language that also happens to fix hierarchy: a dossier is a structured document (title block → narrative → record sheet), not a pile of equal cards.

### 3.1 Guiding principles

- **Content-first. No unnecessary flavor text.** Show real database content only. Do not invent taglines, embellished descriptions, or decorative sentences. Structural micro-labels are allowed only when they carry real information (e.g. the entity type, a chapter number, a real ID). Redundant eyebrows (e.g. "SUBJECT ·" when the breadcrumb already says Character) are removed. The embellished description copy used in the mockup ("Cool, theatrical, and always three moves ahead…") is **not** part of the design — descriptions render verbatim from the DB.
- **One system, three skins.** The character page is the reference template. Gamble and arc pages are the *same* layout with three things swapped: (a) accent color, (b) tab set, (c) stat trio + section content. Nothing else diverges. This is what makes them feel like one family.
- **Two clear tiers, not N equal cards.** Narrative/primary content reads like a document (ruled sections). Metadata/secondary content collapses into a single "record sheet" aside. No more uniform card grid.
- **Calm and instant.** Content is present and visible on load. Motion is a single short fade, never a gate on visibility.
- **Preserve brand equity.** Keep the blackletter OPTIGoudy for the L-File logo/brand mark. Entity names move to a clean editorial serif for readability and the document feel.

### 3.2 Typography

| Role | Font | Notes |
|---|---|---|
| L-File logo / brand mark | OPTIGoudy (blackletter) | Unchanged. Nav only. |
| Entity names (H1) | Editorial serif | New. High-contrast serif (e.g. Playfair Display or a licensed equivalent). Replaces OPTIGoudy for entity H1s. |
| Section headers, labels, stats, field keys | Monospace | The "dossier" voice — `§01`, field labels, stat values, chapter tags. |
| Body / descriptions | Noto Sans (existing) | Comfortable reading size (≈16px, line-height ≈1.7) for narrative. |

> Font choice for the serif is an implementation decision (must be self-hosted like the existing OPTIGoudy for performance/CSP). Playfair Display is the reference used in mockups.

### 3.3 Color

- Each page's **single structural accent = its entity color** (character amber, gamble crimson, arc flame), used for: the hero eyebrow rule, the H1 rule, stat values, active tab underline, section `§` markers, record-sheet dots/keys, tag chips.
- Brand red `#e11d48` is reserved for the global nav/logo and cross-cutting brand moments — not for per-entity accenting.
- Cross-references keep their own entity color as a small dot/text (e.g. a gamble listed on a character page shows a crimson dot), reinforcing the site-wide color language.

## 4. Page anatomy (character = reference)

```
NAV (brand, unchanged)
Breadcrumb  ── monospace, entity-accent "here" segment
┌─ HERO (evolve DetailPageHeader) ───────────────────────────────┐
│  left: FILE №<id> tag · <ENTITY TYPE> eyebrow                   │
│        <Entity Name>  (editorial serif)                         │
│        <alias/subtitle if real data exists>                     │
│        accent rule · stat trio (mono) · tag chips              │
│  right: cinematic portrait zone (existing media cycling +      │
│         lightbox) · suit watermark · chapter chip              │
└────────────────────────────────────────────────────────────────┘
TABS  ── file-tab style, active = entity-accent underline
┌─ BODY: editorial two-column grid ─────────────┬───────────────┐
│  MAIN (document)                              │  ASIDE        │
│   §01 Description   (verbatim prose)          │  RECORD SHEET │
│   §02 Relationships (list rows)               │  (one panel)  │
│   §03 Organizations (list rows)               │   Details     │
│   … per entity                                │   Related …   │
│                                               │   Quote       │
└───────────────────────────────────────────────┴───────────────┘
```

### 4.1 Hero (evolve `DetailPageHeader`)

- Keep: portrait media cycling, lightbox modal, spoiler gating, entity accent, stats, tags, blurred atmospheric bg. These already work.
- Change: name font → editorial serif; add the `FILE №<id>` dossier tag (uses the real entity id); eyebrow shows the entity type only (drop redundant qualifiers); add a subtle suit watermark to the portrait zone; tighten the accent rule + stat treatment to the dossier style.
- Remove: any eyebrow text that duplicates the breadcrumb; no invented subtitle — the alias/subtitle line renders only when the entity actually has one (e.g. character `alternateNames`), otherwise it's omitted.

### 4.2 Tabs

- Restyle the existing Mantine `Tabs` from "pills" to underlined file-tabs: active tab = entity-accent bottom border + accent text; inactive = muted. Count badges retained (e.g. Timeline `2`).
- No structural change to tab logic (hash sync, `keepMounted`).

### 4.3 Body — main column (the "document")

- Introduce a **document-section** treatment (a variant of `CinematicCard`, or a new lightweight `DocSection` wrapper): a numbered monospace header (`§01 DESCRIPTION`) with a hairline rule, and content directly beneath — **no heavy card chrome around narrative content**.
- Description renders the DB value verbatim through the existing `EnhancedSpoilerMarkdown` (spoiler + entity-embed behavior preserved).
- Relationships / organizations render as **list rows** (monogram, name + chapter, one-line real description, role chip) rather than nested cards.

### 4.4 Body — aside (the "record sheet")

- Collapse the current stack of separate aside cards (Details, Story Arcs, Gambles, Quotes) into **one bordered panel** with internal ruled sub-sections. This is the single biggest hierarchy win: metadata stops competing with narrative for card-weight.
- `Details`: monospace key/value rows (Debut, Organization, Gambles count, Arcs count…).
- Related lists (`RelatedContentSection`): compact rows with entity-color dots and `›` affordance, inside the same panel.
- A pulled quote at the bottom when the entity has quotes.

### 4.5 Per-entity variants

| | Character | Gamble | Arc |
|---|---|---|---|
| Accent | amber `#f5a623` | crimson `#e63946` | flame `#ff6b35` |
| Stat trio (example) | Gambles · Debut · Arcs | Participants · Chapter · Outcome | Chapters · Gambles · Order |
| Tabs | Overview / Timeline / Media / Annotations | (existing gamble tabs) | (existing arc tabs) |
| Main sections | Description, Relationships, Organizations | Rules, Factions/Participants, Outcome, Strategy | Summary, Chapters, Characters/Gambles |
| Record sheet | Details, Story Arcs, Gambles, Quotes | Details, Related characters, Related media | Details, Volume/Chapters, Related |

Exact per-entity section lists are taken from each page's current content (no new content types introduced).

## 5. The jank fix (motion)

- Replace staggered `opacity: 0 → 1` reveal chains and delay ladders with a **single page-level fade** (~150–200ms) that never leaves content invisible if motion doesn't run.
- Ensure `useSafeMotion` / reduced-motion paths render the *visible* end state (no `opacity: 0` resting state).
- Remove scroll/`LazySection` gating from **above-the-fold and primary** detail content so it is present on first paint. Lazy-loading may remain for genuinely heavy, below-the-fold, network-bound widgets (e.g. media gallery, annotations) but must render a real placeholder, never a blank region.
- Target: the hero and Overview body are fully visible on first paint with no pop-in.

## 6. Responsive

- Two-column body collapses to single column below `md` (768px); the record sheet moves below the main document.
- Hero: portrait zone reduces/stacks under the title block on narrow widths (existing header already has mobile handling to build on).
- Tabs scroll horizontally if they overflow on mobile.

## 7. Accessibility

- Maintain heading semantics (single H1 = entity name; section headers as H2).
- Entity-accent text on dark must meet AA for body-size text; the mono labels use accent at sizes/weights that pass, or a lightened tint where needed.
- Decorative layers (`FILE №`, suit watermark, rules, textures) are `aria-hidden`.
- Reduced-motion honored (see §5).

## 8. Non-goals / out of scope

- Homepage, list/browse pages, submission flows, admin, auth — not touched.
- No backend/API/data-model changes. No new content types.
- No change to spoiler/progress logic, media pipeline, or routing.
- Light mode — site remains dark-only.

## 9. Rollout order

1. Shared layer: evolve `DetailPageHeader`, add the document-section + record-sheet treatments, restyle tabs, fix motion. Ship behind the character page.
2. Apply to **character** page → verify end-to-end on a real entity.
3. Port to **gamble**, then **arc** (accent + tabs + stats + section wiring only).
4. Visual QA pass across all three at desktop + mobile with real data.

## 10. Risks & open questions

- **Serif licensing/hosting.** Need a self-hosted editorial serif comparable to Playfair with a proper license. Fallback: use OPTIGoudy for names after all (owner already leaned toward serif). Flag before implementation.
- **Portrait art dependency.** The cinematic hero looks best with good key art; the no-image fallback (entity-tinted glow) must still look intentional. Existing header already has a fallback to build on.
- **Per-entity stat trios.** Confirm the exact 3 stats for gamble and arc during implementation from live data (character is settled: Gambles / Debut / Arcs).

---

## Appendix: mockup reference

The approved character-page mockup (Case File direction, amber accent, cinematic hero) is the visual target for §4. Note that the mockup's description paragraph is placeholder-embellished; per §3.1 the real page renders the DB description verbatim.
