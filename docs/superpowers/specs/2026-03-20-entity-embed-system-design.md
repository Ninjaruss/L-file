# Entity Embed System — Design Spec

**Date:** 2026-03-20
**Status:** Approved

## Overview

Improve the entity embed system across four dimensions: visual design, rich text editor, site-wide coverage expansion, and entity data caching. The `{{type:id:text}}` markdown syntax and `EnhancedSpoilerMarkdown` renderer are preserved unchanged — all improvements are additive on the authoring and display sides.

## Goals

1. **Design (A)** — Replace pill chips with visually richer inline embed blocks (bordered + avatar). Upgrade HoverCard previews.
2. **Rich editor (C)** — Replace all plain markdown textareas with a Tiptap-based rich text editor that supports embed insertion via toolbar button.
3. **Coverage (B)** — Add the embed insert helper to all submission and edit forms that previously lacked it.
4. **Performance (D)** — Cache entity fetch results to eliminate redundant API requests.

## Non-Goals

- Changing the storage format (stays `{{type:id:text}}` markdown)
- Modifying the backend or any API endpoints
- Migrating existing content
- Replacing `EnhancedSpoilerMarkdown` (render side untouched)
- Auto-linking entity names (no implicit embeds)

---

## Architecture

```
1. EntityCard (redesign)
   ├── New chip: bordered block + 20×20 avatar (initial or thumbnail)
   ├── Color-coded by entity type (existing palette)
   └── Richer HoverCard: image panel + type label + description + tag pills

2. RichMarkdownEditor (new shared component)
   ├── Tiptap editor (StarterKit + tiptap-markdown + Link)
   ├── Custom EntityEmbed node extension
   │   ├── Atomic inline node — select/delete as a unit
   │   ├── Rendered as EntityCard chip via React NodeView
   │   └── Serializes to/from {{type:id:text}} via tiptap-markdown custom rule
   ├── Toolbar: B, I, H₁, H₂, List, Blockquote, Link | Insert Entity
   └── Insert Entity modal (adapted from EntityEmbedHelperWithSearch)

3. Coverage expansion
   ├── All markdown <textarea> fields replaced with RichMarkdownEditor
   └── EnhancedSpoilerMarkdown unchanged on render side

4. Entity data cache (entityEmbedParser.ts)
   ├── Module-level Map<string, Promise<EntityData | null>>
   ├── Key: "type:id"
   └── Deduplicates parallel fetches; reused across re-renders
```

---

## Component Details

### `EntityCard` (redesign)

**Chip (inline mode):**
- Bordered block: `background: #1a2535`, `border: 1px solid rgba(color, 0.3)`, `border-radius: 6px`
- Left: 20×20 avatar square — entity thumbnail if loaded, else initial letter or type icon
- Right: display text in entity type color
- Padding: `3px 10px 3px 4px`
- Hover: `filter: brightness(1.1)` on the whole chip

**HoverCard (on hover):**
- Left panel: image/avatar (44×54px) with colored background
- Right column: type label (small caps, type color) → entity name (bold) → description excerpt (2–3 lines, muted) → 1–2 tag pills
- Border: 1px solid with subtle type color tint on top border
- Max width: 300px, box-shadow: `0 8px 24px rgba(0,0,0,0.5)`

**Card mode** (standalone, unchanged behavior — only inline mode redesigned)

### `RichMarkdownEditor` (new)

**File:** `client/src/components/RichMarkdownEditor.tsx`

**Props:**
```ts
interface RichMarkdownEditorProps {
  value: string;               // Markdown string
  onChange: (md: string) => void;
  placeholder?: string;
  minHeight?: number;          // Default: 200
  disabled?: boolean;          // Falls back to EnhancedSpoilerMarkdown when true
}
```

**Tiptap extensions:**
- `StarterKit` — bold, italic, h1/h2, lists, blockquote, code, hardBreak
- `tiptap-markdown` — markdown serialization; custom `{{type:id:text}}` parse/serialize rule
- `Link` — hyperlinks with `openOnClick: false` in editor
- `EntityEmbed` (custom) — atomic inline node, React NodeView renders `<EntityCard>`

**EntityEmbed node:**
- `group: 'inline'`, `inline: true`, `atom: true`
- Attributes: `entityType`, `entityId`, `displayText` (optional)
- Parse rule: matches `{{type:id}}` and `{{type:id:text}}` in markdown input
- Serialize rule: outputs `{{entityType:entityId:displayText}}` or `{{entityType:entityId}}`
- NodeView: renders `<EntityCard mode="inline" ... />`; not editable, cursor skips over it

**Toolbar actions:**
- Bold, Italic, H1, H2, Bullet list, Ordered list, Blockquote, Link
- Separator
- "Insert entity" button → opens `InsertEntityModal`

**InsertEntityModal:**
- Adapted from `EntityEmbedHelperWithSearch`
- On entity select: calls `editor.commands.insertContent({ type: 'entityEmbed', attrs: { entityType, entityId, displayText } })`
- Replaces clipboard-copy flow entirely

### Entity Data Cache

**File:** `client/src/lib/entityEmbedParser.ts`

```ts
// Module-level cache — survives re-renders, reset on full page load
const entityCache = new Map<string, Promise<EntityData | null>>();

function fetchEntityData(type: EntityType, id: number): Promise<EntityData | null> {
  const key = `${type}:${id}`;
  if (!entityCache.has(key)) {
    entityCache.set(key, fetchFromApi(type, id));
  }
  return entityCache.get(key)!;
}
```

Deduplicates parallel fetches for the same entity (e.g., a character referenced 3× on one page triggers one API call). Promise-based so concurrent callers await the same in-flight request.

---

## Coverage — Fields Getting RichMarkdownEditor

### Public submission forms
| Page | Field(s) |
|------|----------|
| `/submit-guide` | Guide content |
| `/submit-annotation` | Annotation content |

### In-page edit modes (mod/editor/admin)
| Page | Field(s) |
|------|----------|
| `/guides/[id]` | Guide content |
| `/characters/[id]` | Description, Backstory |
| `/arcs/[id]` | Description |
| `/gambles/[id]` | Description, Rules, Win condition, Explanation |
| `/organizations/[id]` | Description |
| `/events/[id]` | Description, Details |

### Admin panel (React Admin)
Character, Arc, Gamble, Organization, Guide description fields in admin edit views — replaced with `RichMarkdownEditor` or `EntityEmbedHelperWithSearch` alongside existing textarea, depending on complexity of the admin form.

---

## Data Flow (authoring)

```
User types in RichMarkdownEditor
    ↓
Tiptap document (JSON internally)
    ↓
tiptap-markdown serializes to markdown string
  EntityEmbed node → {{character:1:Baku Madarame}}
    ↓
onChange(markdownString) called
    ↓
Form state updated → submitted to API → stored in DB as markdown
    ↓
On render: EnhancedSpoilerMarkdown parses {{...}} → EntityCard chips
```

---

## Dependencies to Add

| Package | Purpose |
|---------|---------|
| `@tiptap/react` | Tiptap React integration |
| `@tiptap/starter-kit` | Core formatting extensions |
| `@tiptap/extension-link` | Hyperlink support |
| `tiptap-markdown` | Markdown serialization/deserialization |

All added to `client/`.

---

## Error Handling

- If entity fetch fails (404 or network error), `EntityCard` renders a muted "Unknown [type]" chip. Cache stores the null result to prevent retries.
- If `tiptap-markdown` encounters malformed `{{...}}` syntax, it passes it through as plain text (no crash).
- `RichMarkdownEditor` with `disabled=true` renders `EnhancedSpoilerMarkdown` instead of the editor — no Tiptap instance mounted.

---

## Out of Scope (future)

- Collaborative editing
- Image upload inside the editor
- Inline auto-complete for entity names (without `/` trigger)
- Backend validation of embed syntax
- Cascade handling when a referenced entity is deleted
