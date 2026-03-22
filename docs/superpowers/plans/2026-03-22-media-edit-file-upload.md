# Media Edit File Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a URL ↔ File Upload tab toggle to the media edit page for moderators and admins, and fix the pre-existing bug where URL edits are silently dropped.

**Architecture:** Two changes: (1) a small backend fix to `UpdateOwnMediaDto` + `media.service.ts` so the `url` field is actually persisted on PATCH, and (2) a frontend Mantine `Tabs` toggle inside the existing "Media Link" `FormSection` of `EditMediaPageContent.tsx` that lets privileged users switch between URL input and an inline file dropzone. The file is staged locally and submitted atomically with the rest of the form.

**Tech Stack:** NestJS (class-validator, TypeORM), Next.js 15, React 19, Mantine UI (`Tabs`, `rem`, existing theme helpers), Lucide React icons, Cloudflare R2 (already wired — no changes needed).

---

## File Map

| File | Change type | Responsibility |
|------|------------|----------------|
| `server/src/modules/media/dto/update-own-media.dto.ts` | Modify | Add optional `url` field with `@IsUrl()` validation |
| `server/src/modules/media/media.service.ts` | Modify | Apply `updateData.url` when no file is provided in `updateOwnSubmission()` |
| `client/src/app/media/[id]/edit/EditMediaPageContent.tsx` | Modify | Add tab state, dropzone, mode-aware validation, mode-aware submit logic |

No new files. No other files touched.

---

## Task 1: Backend — Persist URL Edits

**Files:**
- Modify: `server/src/modules/media/dto/update-own-media.dto.ts`
- Modify: `server/src/modules/media/media.service.ts:540-552`

### Context for implementer

`UpdateOwnMediaDto` currently has fields for `description`, `ownerType`, `ownerId`, and `chapterNumber` — but **no `url` field**. The frontend appends `url` to FormData, but the backend silently ignores it. The `PATCH /media/my-submissions/:id` controller already has `FileInterceptor` and full R2 upload support; the only missing piece is URL persistence.

In `media.service.ts`, `updateOwnSubmission()` applies metadata fields at lines ~540-552, then handles file upload in an `if (file)` block. The new URL assignment must go between these two sections.

- [ ] **Step 1: Add `url` to `UpdateOwnMediaDto`**

Open `server/src/modules/media/dto/update-own-media.dto.ts`. The file currently imports `IsEnum`, `IsNumber`, `IsOptional`, `IsString`. Add `IsUrl` to that import. Then add this property after the existing `description` field:

```typescript
@ApiPropertyOptional({
  description: 'URL of the media content',
  example: 'https://www.pixiv.net/en/artworks/12345',
})
@IsOptional()
@IsUrl({}, { message: 'url must be a valid URL' })
url?: string;
```

The import line should become:
```typescript
import { IsEnum, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';
```

- [ ] **Step 2: Apply `url` in `updateOwnSubmission()`**

Open `server/src/modules/media/media.service.ts`. Find the section at roughly line 540 that begins:

```typescript
// Update metadata fields if provided
if (updateData.description !== undefined) {
  media.description = updateData.description;
}
// ...
if (updateData.chapterNumber !== undefined) {
  media.chapterNumber = updateData.chapterNumber;
}
```

Add the following **immediately after** the `chapterNumber` block and **before** the `// Handle file replacement if a new file is provided` comment:

```typescript
// Apply URL update only when no file is being uploaded (file takes precedence)
if (updateData.url !== undefined && !file) {
  media.url = updateData.url;
  media.isUploaded = false;
}
```

- [ ] **Step 3: Verify the backend builds**

```bash
cd server && yarn build
```

Expected: build completes with no TypeScript errors. If `IsUrl` is not found, check the `class-validator` import — it ships with NestJS by default.

- [ ] **Step 4: Lint**

```bash
cd server && yarn lint
```

Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/media/dto/update-own-media.dto.ts \
        server/src/modules/media/media.service.ts
git commit -m "fix(media): persist url field on own-submission PATCH"
```

---

## Task 2: Frontend — Add Tab Toggle + Dropzone

**Files:**
- Modify: `client/src/app/media/[id]/edit/EditMediaPageContent.tsx`

### Context for implementer

The file currently imports from `@mantine/core`: `Alert, Box, Button, Card, Container, Group, Loader, NumberInput, Select, SimpleGrid, Stack, Text, TextInput, Textarea, rem, useMantineTheme`. It uses `useRef` is **not** imported yet — you will need to add it.

The `Upload` icon is already imported from `lucide-react` (line 22). The `LinkIcon` icon is imported as `Link as LinkIcon`.

The `user` object has a `role` field typed as a string from `useAuth()`. The role check used elsewhere in the codebase is:
```typescript
const isPrivilegedUser = user.role === 'moderator' || user.role === 'admin'
```

The "Media Link" `FormSection` is step 1 (lines 310-344 of the current file). It currently contains only a `TextInput`. The entire contents of this `FormSection` need to be replaced for privileged users.

The submit page at `client/src/app/submit-media/SubmitMediaPageContent.tsx` uses this Mantine Tabs pattern for reference — the Tabs list is rendered conditionally on `isPrivilegedUser`, and the two panels are rendered with `activeTab === 'url'` / `activeTab === 'upload'` conditionals. The edit page will use the same pattern but with the Tabs placed **inside** the existing `<form>`, not wrapping a second form.

The `AMBER` constant (`'#f59e0b'`) and the amber dirty badge snippet are already in scope.

The existing `accentColor` is `getEntityColor('media')`.

- [ ] **Step 1: Add new imports**

At the top of `EditMediaPageContent.tsx`, update the import lines:

1. Add `useRef` to the React import:
```typescript
import React, { useState, useEffect, useMemo, useRef } from 'react'
```

2. Add `Tabs` to the Mantine import:
```typescript
import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
  Textarea,
  rem,
  useMantineTheme,
} from '@mantine/core'
```

- [ ] **Step 2: Add new state variables**

Inside `EditMediaPageContent` function, after the existing state declarations (around line 88), add:

```typescript
const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')
const [stagedFile, setStagedFile] = useState<File | null>(null)
const [dropError, setDropError] = useState<string | null>(null)
const [dragActive, setDragActive] = useState(false)
const fileInputRef = useRef<HTMLInputElement | null>(null)

const isPrivilegedUser = !!user && (user.role === 'moderator' || user.role === 'admin')
```

Note: `isPrivilegedUser` is safe to declare before the auth guard returns because `user` may be `null` at that point — the `!!user &&` guard handles it.

- [ ] **Step 3: Add file selection handlers**

Add these functions after `handleInputChange` (around line 98):

```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const handleFileSelect = (file: File) => {
  setDropError(null)
  if (!ALLOWED_TYPES.includes(file.type)) {
    setDropError('Only JPEG, PNG, WebP, and GIF files are allowed.')
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    setDropError('File must be 5 MB or smaller.')
    return
  }
  setStagedFile(file)
}

const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(true)
}

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)
}

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)
  const file = e.dataTransfer.files[0]
  if (file) handleFileSelect(file)
}

const handleTabChange = (value: string | null) => {
  const tab = (value as 'url' | 'upload') ?? 'url'
  setActiveTab(tab)
  if (tab === 'url') {
    setStagedFile(null)
    setDropError(null)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

- [ ] **Step 4: Update `validateForm()`**

Replace the existing `validateForm` function (lines 109-115) with this mode-aware version:

```typescript
const validateForm = () => {
  if (activeTab === 'upload') {
    if (!stagedFile) return 'Please select a file to upload'
  } else {
    if (!formData.url.trim()) return 'Media URL is required'
    if (!isValidUrl(formData.url)) return 'Please enter a valid URL'
  }
  if (!formData.ownerType) return 'Please select an entity type'
  if (!formData.ownerId) return 'Please select a specific entity'
  return null
}
```

- [ ] **Step 5: Update `handleSubmit()`**

Replace the FormData building block inside `handleSubmit` (currently lines 160-165):

```typescript
// Before:
const fd = new FormData()
fd.append('url', formData.url.trim())
fd.append('ownerType', formData.ownerType)
fd.append('ownerId', String(formData.ownerId!))
if (formData.chapterNumber) fd.append('chapterNumber', String(formData.chapterNumber))
if (formData.description.trim()) fd.append('description', formData.description.trim())
```

Replace with:

```typescript
const fd = new FormData()
if (activeTab === 'upload' && stagedFile) {
  fd.append('file', stagedFile)
} else {
  fd.append('url', formData.url.trim())
}
fd.append('ownerType', formData.ownerType)
fd.append('ownerId', String(formData.ownerId!))
if (formData.chapterNumber) fd.append('chapterNumber', String(formData.chapterNumber))
if (formData.description.trim()) fd.append('description', formData.description.trim())
```

- [ ] **Step 6: Update the "current media" hint text**

Find this text in the existing media preview box (around line 304):

```typescript
<Text size="xs" c="dimmed" mt="xs">
  Update the URL below to replace it.
</Text>
```

Replace with:

```typescript
<Text size="xs" c="dimmed" mt="xs">
  {activeTab === 'upload' ? 'Upload a file below to replace it.' : 'Update the URL below to replace it.'}
</Text>
```

- [ ] **Step 7: Replace the "Media Link" FormSection contents**

Find the `FormSection` for "Media Link" (lines 310-344). Replace the entire `<FormSection>` block (opening tag through closing `</FormSection>`) with the following:

```tsx
<FormSection
  title="Media Link"
  description={activeTab === 'upload' ? 'Upload an image file to replace the current media' : 'Update the URL to a video, audio track, or media post'}
  icon={activeTab === 'upload' ? <Upload size={18} color={accentColor} /> : <LinkIcon size={18} color={accentColor} />}
  accentColor={accentColor}
  required
  stepNumber={1}
  hasValue={activeTab === 'upload' ? !!stagedFile : !!formData.url}
>
  {/* Tab toggle — moderators and admins only */}
  {isPrivilegedUser && (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      mb="md"
    >
      <Tabs.List>
        <Tabs.Tab value="url" leftSection={<LinkIcon size={14} />}>
          URL
        </Tabs.Tab>
        <Tabs.Tab value="upload" leftSection={<Upload size={14} />}>
          Upload File
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  )}

  {/* URL mode */}
  {activeTab === 'url' && (
    <TextInput
      label={
        <span>
          Media URL
          {isDirty('url') && (
            <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
              edited
            </span>
          )}
        </span>
      }
      placeholder="https://…"
      value={formData.url}
      onChange={(e) => handleInputChange('url', e.currentTarget.value)}
      required
      description={urlError ? undefined : 'YouTube, TikTok, Instagram, DeviantArt, Pixiv, SoundCloud, direct links, etc.'}
      error={urlError}
      leftSection={
        <Box style={{ display: 'flex', alignItems: 'center' }}>
          <LinkIcon size={16} />
        </Box>
      }
      leftSectionPointerEvents="none"
      styles={inputStyles}
    />
  )}

  {/* Upload mode — moderators and admins only */}
  {activeTab === 'upload' && (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.currentTarget.files?.[0]
          if (file) handleFileSelect(file)
          e.currentTarget.value = ''
        }}
      />

      {stagedFile ? (
        /* File preview */
        <Box
          style={{
            border: `1px solid ${accentColor}40`,
            borderRadius: rem(8),
            padding: rem(12),
            backgroundColor: `${accentColor}08`,
            display: 'flex',
            alignItems: 'center',
            gap: rem(12),
          }}
        >
          <img
            src={URL.createObjectURL(stagedFile)}
            alt="Preview"
            style={{ width: rem(56), height: rem(56), objectFit: 'cover', borderRadius: rem(4), flexShrink: 0 }}
          />
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} style={{ wordBreak: 'break-all' }}>
              {stagedFile.name}
              <span style={{ fontSize: rem(10), background: 'rgba(245,158,11,0.1)', color: AMBER, border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 5px', marginLeft: 6 }}>
                edited
              </span>
            </Text>
            <Text size="xs" c="dimmed">{formatFileSize(stagedFile.size)}</Text>
          </Box>
          <Button
            variant="subtle"
            size="xs"
            color="red"
            onClick={() => { setStagedFile(null); setDropError(null) }}
            style={{ flexShrink: 0 }}
          >
            ✕
          </Button>
        </Box>
      ) : (
        /* Dropzone */
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? accentColor : `${accentColor}40`}`,
            borderRadius: rem(8),
            padding: rem(32),
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragActive ? `${accentColor}12` : 'transparent',
            transition: 'all 150ms ease',
          }}
        >
          <Upload size={24} color={accentColor} style={{ marginBottom: rem(8) }} />
          <Text size="sm" c="dimmed">
            Drag & drop an image here, or{' '}
            <span style={{ color: accentColor, textDecoration: 'underline' }}>browse</span>
          </Text>
          <Text size="xs" c="dimmed" mt={4}>JPEG, PNG, WebP, GIF — max 5 MB</Text>
        </Box>
      )}

      {dropError && (
        <Text size="xs" c="red" mt="xs">{dropError}</Text>
      )}
    </Box>
  )}
</FormSection>
```

- [ ] **Step 8: Verify the frontend builds**

```bash
cd client && yarn build
```

Expected: build succeeds with no TypeScript errors. Common issues to watch for:
- `useRef` not in the React import — add it if missing
- `Tabs` not in the Mantine import — add it if missing
- `dragActive` used before declaration — ensure state declarations are before all usage

- [ ] **Step 9: Lint**

```bash
cd client && yarn lint
```

Expected: no new errors. If ESLint complains about `URL.createObjectURL` in an SSR context, add `// eslint-disable-next-line` above that line — the component is `'use client'` so it's safe.

- [ ] **Step 10: Manual smoke test**

Start the dev servers:
```bash
# Terminal 1
cd server && yarn start:dev
# Terminal 2
cd client && yarn dev
```

Test as a **regular user** (role: `user`):
1. Log in as a non-privileged user and navigate to one of their pending media submissions at `/media/[id]/edit`
2. Confirm: no tab toggle is visible, only the URL TextInput appears
3. Edit the URL and click "Save & Resubmit" → confirm it saves (previously broken bug fix)

Test as a **moderator or admin**:
1. Log in as a mod/admin and navigate to any pending media submission they own (or use admin access)
2. Confirm: Mantine Tabs are visible with "URL" and "Upload File" tabs
3. URL tab: existing TextInput is shown, editing and submitting works
4. Upload tab: click tab → dropzone appears
5. Drag or browse a valid image → preview thumbnail appears with filename, size, and amber "edited" badge
6. Click ✕ → file is cleared, dropzone reappears
7. Switch back to URL tab → staged file is cleared, TextInput reappears
8. Select a file in Upload tab → click "Save & Resubmit" → media URL updates to the R2 upload URL
9. Try uploading a file > 5 MB → inline error appears, file not staged
10. Try uploading a non-image file (e.g., `.pdf`) → inline error appears

- [ ] **Step 11: Commit**

```bash
git add client/src/app/media/\[id\]/edit/EditMediaPageContent.tsx
git commit -m "feat(media-edit): add file upload toggle for mods/admins"
```
