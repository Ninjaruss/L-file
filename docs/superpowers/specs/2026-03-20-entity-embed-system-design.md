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
- Client-side validation of malformed `{{...}}` embed syntax on submit (future)
- Backend validation of embed syntax (future)
- Cascade handling when a referenced entity is deleted (future)

---

## Architecture

```
1. EntityCard (redesign)
   ├── New chip: bordered block + 20×20 avatar (initial or thumbnail)
   ├── Color-coded by entity type (existing palette)
   ├── Richer HoverCard: skeleton loading state → image panel + type label + description + tag pills
   └── Card mode unchanged

2. RichMarkdownEditor (new shared component)
   ├── Tiptap editor (StarterKit + tiptap-markdown + Link)
   ├── Custom EntityEmbed node extension
   │   ├── Atomic inline node — select/delete as a unit
   │   ├── Rendered as EntityCard chip via React NodeView
   │   └── Serializes to/from {{type:id:text}} via tiptap-markdown custom rule
   ├── Toolbar: B, I, H₁, H₂, List, Blockquote, Link | Insert Entity
   ├── Insert Entity modal (adapted from EntityEmbedHelperWithSearch)
   └── disabled=true → renders EnhancedSpoilerMarkdown, no Tiptap instance

3. Coverage expansion
   ├── All markdown <textarea> fields replaced with RichMarkdownEditor
   ├── Admin panel markdown fields: RichMarkdownEditor everywhere (no carve-outs)
   └── EnhancedSpoilerMarkdown unchanged on render side

4. Entity data cache (entityEmbedParser.ts — client-only)
   ├── Module-level Map<string, Promise<EntityEmbedData['data'] | null>>
   ├── Key: "type:id" — deduplicates parallel fetches
   └── Both 404s and network errors resolve to null and are cached for the session (no retry)
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
- **Loading state:** Mantine `Skeleton` placeholders for image panel, title, description, and tags while entity data fetches. HoverCard opens immediately on hover; skeleton resolves to content when data arrives.
- **Loaded state:** Left panel: image/avatar (44×54px) with colored background; Right column: type label (small caps, type color) → entity name (bold) → description excerpt (2–3 lines, muted) → 1–2 tag pills
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
  minHeight?: number;          // Default: 200. Editor auto-grows with content.
  maxHeight?: number;          // Optional. When set, editor scrolls internally beyond this height.
  label?: string;              // Passed to Mantine InputWrapper for <label> association
  'aria-label'?: string;       // Used when no visible label is needed
  disabled?: boolean;          // Falls back to EnhancedSpoilerMarkdown when true
}
```

**Height behavior:** The editor canvas auto-grows with content (no fixed height). `minHeight` sets a minimum canvas height so short content doesn't collapse the editor. If `maxHeight` is provided, the canvas scrolls internally beyond that height. If neither is constraining, the editor expands to fit its content.

**Accessibility:** `RichMarkdownEditor` wraps the Tiptap `EditorContent` in a Mantine `InputWrapper`. Mantine's `InputWrapper` renders a `<label>` with `htmlFor`, which does not natively associate with a `contenteditable` div. To establish a programmatic label association, the implementer must render the label element with an explicit `id` (e.g., `${componentId}-label`) and apply `aria-labelledby` pointing to that id on the Tiptap `EditorContent` element directly. Mantine does not auto-generate this `id` — it must be assigned manually on the label element (e.g., via `InputWrapper`'s `labelProps={{ id: labelId }}`) and referenced on the editor div. When no visible label is needed, `aria-label` is applied directly to the Tiptap editor element instead.

**`disabled` / edit toggle behavior:** When `disabled` changes from `false` to `true`, the Tiptap instance is unmounted and `EnhancedSpoilerMarkdown` renders from the current `value` prop. When `disabled` changes back to `false`, a fresh Tiptap instance is created and initialized from `value`. The editor does **not** attempt to preserve internal undo history across disabled transitions — it rehydrates from `value` each time. This matches the in-page edit patterns on character, arc, gamble, and organization pages where the edit form is mounted/unmounted around a save action.

**Tiptap extensions:**
- `StarterKit` — bold, italic, h1/h2, lists, blockquote, code (keyboard-accessible; not in toolbar — intentional), hardBreak (Shift+Enter; not in toolbar — intentional)
- `tiptap-markdown` — markdown serialization; custom `{{type:id:text}}` parse/serialize rule added via `tiptap-markdown`'s `MarkdownNode` mixin using `addMarkdownSerializer` / `addMarkdownParser` hooks
- `Link` — hyperlinks with `openOnClick: false` in editor
- `EntityEmbed` (custom) — atomic inline node, React NodeView renders `<EntityCard>`

**EntityEmbed node:**
- `group: 'inline'`, `inline: true`, `atom: true`
- Attributes: `entityType`, `entityId`, `displayText` (nullable string, default `null`)
- Parse rule: matches `{{type:id}}` and `{{type:id:text}}` in markdown input
- Serialize rule: outputs `{{entityType:entityId:displayText}}` when `displayText` is a non-empty string; outputs `{{entityType:entityId}}` when `displayText` is null, undefined, or an empty string
- NodeView: renders `<EntityCard mode="inline" ... />`; not editable, cursor skips over it

**`tiptap-markdown` custom rule integration:**
The `EntityEmbed` extension uses `tiptap-markdown`'s `MarkdownNode` mixin:
- **Serializer:** Added via `addMarkdownSerializer` — outputs `{{entityType:entityId:displayText}}` for the node.
- **Parser:** `tiptap-markdown` does not have a symmetric `addMarkdownParser` hook. The parse side is wired by registering a custom `markdown-it` inline rule directly on the `tiptap-markdown` plugin instance (via `md.inline.ruler.push`). The rule tokenizes `{{type:id:text}}` patterns and emits `entityEmbed` tokens that Tiptap picks up as nodes. Consult `tiptap-markdown`'s README for the inline rule registration API — this is the highest-risk integration point and should be prototyped first.

**Toolbar actions:**
- Bold, Italic, H1, H2, Bullet list, Ordered list, Blockquote, Link
- Separator
- "Insert entity" button → opens `InsertEntityModal`

**InsertEntityModal:**
- Adapted from `EntityEmbedHelperWithSearch` (the original component is retained in the codebase but removed from all authoring forms; available for potential future non-editor use cases)
- UI flow: user selects entity type from filter chips → types in search box (debounced 300ms) → results list shows → clicks a result → a display text input appears below the results pre-filled with the entity name, allowing override → confirm button inserts the embed. Cancel button or Escape closes without inserting. The display text input appears only after an entity is selected (not before), to keep the initial state simple.
- On entity select: calls `editor.commands.insertContent({ type: 'entityEmbed', attrs: { entityType, entityId, displayText } })`
- The primary change from `EntityEmbedHelperWithSearch` is replacing the clipboard-copy action with `editor.commands.insertContent`; the search/filter UI is reused as-is.

### Entity Data Cache

**File:** `client/src/lib/entityEmbedParser.ts`

**Important:** This file must remain client-only — do not import it from Server Components or route handlers. A module-level `Map` in a server-side module would be shared across all requests (request bleed). A `'use client'` directive is not needed on a plain `.ts` utility file; the constraint is on the import graph: only import this from client components.

The existing `fetchEntityData` function in this file is a plain async function with no caching. It is **replaced** by the cached version below. The existing `EntityEmbedData` type (already defined in the file as `{ type, id, data? }`) is the return type used in the cache.

```ts
// Module-level cache — survives re-renders, reset on full page load
// Key: "type:id" → Promise resolving to entity data or null
const entityCache = new Map<string, Promise<EntityEmbedData['data'] | null>>();

// Replaces the existing fetchEntityData function
function fetchEntityData(type: EntityEmbedData['type'], id: number): Promise<EntityEmbedData['data'] | null> {
  const key = `${type}:${id}`;
  if (entityCache.has(key)) {
    return entityCache.get(key)!;
  }
  // Both 404s and network errors resolve to null and are cached for the session.
  // This is the simplest policy: no retry within a session.
  // Future: TTL-based eviction if transient-error caching becomes a problem.
  const promise = fetchFromApi(type, id).catch(() => null);
  entityCache.set(key, promise);
  return promise;
}
```

Deduplicates parallel fetches for the same entity (e.g., a character referenced 3× on one page triggers one API call). Promise-based so concurrent callers await the same in-flight request. **Cache policy:** both 404s and network errors resolve to `null` and are cached for the session — no retry. If retry-on-transient-error is needed, a TTL-based eviction can be added in the future.

---

## Coverage — Fields Getting RichMarkdownEditor

### Public submission forms
| Page | Field(s) |
|------|----------|
| `/submit-guide` | Guide content |
| `/submit-annotation` | Annotation content |

*Note: The `/submit-annotation` form handles both new submissions and user edits (via `?edit=<annotationId>`). When an edit ID is present, the form loads the existing annotation and calls `updateAnnotation` on submit. `RichMarkdownEditor` must replace the `content` `Textarea` in both create and edit modes.*

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
All markdown fields in React Admin edit views use `RichMarkdownEditor` — no carve-outs. Specifically: Character (description, backstory), Arc (description), Gamble (description, rules, win condition, explanation), Organization (description), Guide (content).

React Admin forms are managed by `react-hook-form` via `useFormContext`. `RichMarkdownEditor` (a plain `value`/`onChange` component) must be wrapped in a small React Admin custom input using `useController` from `react-hook-form` to bind to the form's `source` field. This bridge component pattern is consistent across all admin markdown fields. Admin edit views always render the editor in edit mode — the `disabled` prop is not used in the admin context.

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

- **Entity fetch — 404 or network error:** Both resolve to `null` and are cached for the session. `EntityCard` renders a muted "Unknown [type]" chip. HoverCard shows a brief "Not found" message instead of skeletons.
- **Malformed `{{...}}` syntax in existing content:** `tiptap-markdown` parse rule does not match → passes through as plain text (no crash). `EnhancedSpoilerMarkdown` behaves identically on the render side.
- **`disabled=true`:** No Tiptap instance mounted. `EnhancedSpoilerMarkdown` renders from `value`. Toggling `disabled` back to `false` creates a fresh editor from `value`.
