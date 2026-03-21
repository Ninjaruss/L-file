# Admin Dashboard: Chapters Page + Volumes Menu Restructure

**Date:** 2026-03-20
**Status:** Approved

## Summary

Two related changes to the React Admin dashboard:
1. Move Volumes from Core Content to Reference Data in the sidebar menu.
2. Add a full Chapters admin resource (List, Show, Edit, Create) and register it in the menu under Reference Data.

## Scope

### Out of scope
- Backend changes (chapters API already exists with full CRUD)
- Any changes to the public-facing chapters pages
- New fields on the Chapter entity

---

## 1. Menu Restructure (`AdminMenu.tsx`)

**Before — Core Content section:**
Characters, Arcs, Volumes, Gambles, Events

**After — Core Content section:**
Characters, Arcs, Gambles, Events

**Before — Reference Data section:**
Organizations, Quotes, Tags

**After — Reference Data section:**
Organizations, Quotes, Tags, Volumes, Chapters

Icon for Chapters: `Hash` from lucide-react (represents a chapter number/index).

---

## 2. New `Chapters.tsx` Component

Located at: `client/src/components/admin/Chapters.tsx`

### Chapter entity fields
| Field | Type | Notes |
|---|---|---|
| id | number | auto |
| number | number | required, unique (1–539) |
| title | string | optional, max 200 chars |
| summary | text | optional |

### ChapterList
- Default sort: `number ASC`
- Columns: id, number, title, summary (2-line clamp truncated), bulk delete button
- `rowClick="show"`

### ChapterShow
- Header card with indigo gradient, shows chapter number and title
- Tabs: **Overview** (summary text) — no Media tab needed (chapters have no media association)

### ChapterEdit
- Indigo accent (`#6366f1`)
- Fields: Number (required, min 1, max 539), Title (optional), Summary (multiline textarea)
- Uses `EditToolbar` with delete confirmation

### ChapterCreate
- Green accent (`#16a34a`) matching all other Create views
- Same fields as Edit

---

## 3. AdminApp.tsx Changes

- Import `ChapterList, ChapterEdit, ChapterCreate, ChapterShow` from `./Chapters`
- Import `Hash` icon from lucide-react, wrap as `HashIcon` component
- Register `<Resource name="chapters" list={ChapterList} edit={ChapterEdit} create={ChapterCreate} show={ChapterShow} icon={HashIcon} />`

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/admin/AdminMenu.tsx` | Move Volumes to Reference Data; add Chapters item |
| `client/src/components/admin/AdminApp.tsx` | Import + register chapters Resource |
| `client/src/components/admin/Chapters.tsx` | **New file** — ChapterList, ChapterShow, ChapterEdit, ChapterCreate |
