# Design: Prevent Entity Embed Navigation While Editing

**Date:** 2026-04-13  
**Status:** Approved

## Problem

When a user inserts an entity embed chip into the rich text editor (via `RichMarkdownEditor`), clicking the chip during editing navigates to the entity's page via Next.js router, discarding any unsaved work in the editor.

The chip renders an `EntityCard` in inline mode, which renders a `<Link href={entityUrl}>`. Clicking that link triggers `router.push()`, causing page navigation.

## Goal

- Clicking an entity chip inside the editor must not navigate away.
- The HoverCard tooltip on hover must still work.
- Tiptap's native node selection (via `selectable: true` on `EntityEmbedExtension`) must still work — clicks should bubble normally to ProseMirror's editor container.

## Approach

**Option B — `disableNavigation` prop on `EntityCard`.**

Render a `<span>` instead of `<Link>` in the inline chip path when `disableNavigation={true}`. No event propagation hacks; clicks pass through naturally to ProseMirror for node selection.

## Changes

### 1. `client/src/components/EntityCard.tsx`

- Add `disableNavigation?: boolean` to `EntityCardProps`.
- In the `if (inline)` branch (around line 321), conditionally render a styled `<span>` instead of `<Link href={linkHref}>` when `disableNavigation` is true.
- Change `cursor` style from `pointer` to `default` when navigation is disabled.
- All other styles, HoverCard wrappers, and visual content remain identical.

### 2. `client/src/components/RichMarkdownEditor/index.tsx`

- In `EntityEmbedNodeView` (around line 19), pass `disableNavigation` to `EntityCard`:

```tsx
<EntityCard
  type={entityType}
  id={entityId}
  displayText={displayText ?? undefined}
  inline
  disableNavigation
/>
```

## Out of Scope

- No changes to `EntityEmbedExtension.ts`, `Toolbar.tsx`, `InsertEntityModal.tsx`, or any read-only (non-editor) rendering of entity embeds.
- No changes to how entity chips navigate when rendered outside the editor.
