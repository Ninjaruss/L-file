# Design: File Upload Option on Media Edit Page

**Date:** 2026-03-22
**Scope:** `EditMediaPageContent.tsx` (frontend, primary) + `UpdateOwnMediaDto` (backend, small fix)
**Audience:** Moderators and admins only

---

## Problem

The media edit page (`/media/[id]/edit`) has a URL field, but the backend `UpdateOwnMediaDto` does not include a `url` field — meaning URL edits are silently dropped. Additionally, moderators and admins have no way to replace a community-submitted URL with a directly uploaded file on the edit page, unlike the submit page which already supports file upload for privileged users.

---

## Goal

1. Fix the pre-existing bug where `url` edits are silently ignored by adding `url` to `UpdateOwnMediaDto`.
2. Add a **URL ↔ File Upload tab toggle** to the media edit page, visible only to moderators and admins.

---

## Backend Status

The `PATCH /media/my-submissions/:id` controller endpoint **already has full file upload support** implemented:
- `FileInterceptor('file')` with 5 MB limit is already applied
- Magic-byte file validation is already implemented
- R2 upload and old-file deletion are already in `updateOwnSubmission()` in `media.service.ts`
- Any authenticated user who owns the submission can currently supply a file

**Only one small backend change is needed:** add `url` to `UpdateOwnMediaDto` so that URL edits are actually persisted.

---

## Design

### Backend Fix — Add `url` to `UpdateOwnMediaDto`

Add an optional `url` field to `UpdateOwnMediaDto`:

```typescript
@ApiPropertyOptional({ description: 'URL of the media content', example: 'https://...' })
@IsOptional()
@IsUrl()
url?: string;
```

Then in `updateOwnSubmission()`, apply it alongside the other metadata fields:
```typescript
if (updateData.url !== undefined && !file) {
  media.url = updateData.url;
  media.isUploaded = false;
}
```

Note: if a `file` is provided, it takes precedence and `url` is ignored (the R2 upload result becomes the new URL). This preserves existing file-upload behavior.

### Frontend — Mantine Tabs Toggle

**Location:** Inside the existing "Media Link" `FormSection` (step 1), replacing the current `TextInput`.

**Visibility:** The entire `Tabs` block is rendered only when `user.role === 'moderator' || user.role === 'admin'`. Non-privileged users continue to see only the plain `TextInput` (no tabs).

**Pattern:** Mantine `Tabs` with two panels — matching the pattern used in `SubmitMediaPageContent.tsx`.

| Tab | Panel contents |
|-----|----------------|
| URL | Existing `TextInput` for media URL (unchanged behavior) |
| File Upload | Lightweight file dropzone |

**Default tab:** `"url"` always.

**Switching tabs:**
- URL → Upload: TextInput hides, dropzone appears. Previously staged file (if any) is retained.
- Upload → URL: Dropzone hides, TextInput reappears. Staged file is cleared.

---

### Dropzone (File Upload tab)

**Implementation:** A minimal inline dropzone using a hidden native `<input type="file">` with a styled wrapper — **not** `MediaUploadForm`, which includes its own entity selects and would duplicate the selectors already present in the edit form.

**Features:**
- Drag-and-drop area + "Browse" button
- Accepts: JPEG, PNG, WebP, GIF (mirrors backend validation)
- Max size: 5 MB (client-side check with inline error)
- On file selection: show thumbnail preview (for images) + filename + file size
- An "×" button clears the staged file
- No upload happens at this point — file is staged locally

**"Current media" preview hint text:** Changes based on active tab:
- URL tab: `"Update the URL below to replace it."`
- Upload tab: `"Upload a file below to replace it."`

---

### Data Flow — Atomic Submit at Form Submit Time

File upload does **not** happen on file selection. It happens when the user clicks "Save & Resubmit."

**Frontend `handleSubmit` change:**

```typescript
if (activeTab === 'upload' && stagedFile) {
  fd.append('file', stagedFile)
  // Do NOT append 'url' — backend uses file result
} else {
  fd.append('url', formData.url.trim())
}
```

The existing `api.updateOwnMedia(id, fd)` call is unchanged.

---

### Validation

| Mode | Valid when |
|------|-----------|
| URL tab | `url` is non-empty and passes `isValidUrl()` + `ownerType` + `ownerId` set |
| Upload tab | A file is staged + `ownerType` + `ownerId` set |

The amber "edited" dirty badge on the URL label also appears in upload mode when a file is staged.

---

### Error Handling

| Scenario | Behavior |
|----------|----------|
| File too large (>5 MB) | Client blocks selection, shows inline error under dropzone |
| Invalid file type | Client blocks selection, shows inline error |
| Upload fails on server | PATCH returns error; existing `setError()` flow shows it |
| Entity not selected | Same validation error as URL mode |
| Regular user on edit page | Tabs never rendered; plain TextInput shown |

---

### Files Changed

| File | Change |
|------|--------|
| `client/src/app/media/[id]/edit/EditMediaPageContent.tsx` | Add `Tabs`, inline dropzone, staged file state, mode-aware validation and submit logic |
| `server/src/modules/media/dto/update-own-media.dto.ts` | Add optional `url` field with `@IsUrl()` validation |
| `server/src/modules/media/media.service.ts` | Apply `updateData.url` in `updateOwnSubmission()` when no file is provided |

No new components. No other backend files need changes.

---

### Out of Scope

- Annotation, guide, or event edit pages
- Admin panel media editing
- Adding role guards to the backend PATCH endpoint (current behavior allows any owner to upload; UI gating on the frontend is the appropriate boundary for this feature)
- Video or audio file upload (image-only, matching existing upload constraints)
- `MediaUploadForm` component (too heavy; includes duplicate entity selects)
