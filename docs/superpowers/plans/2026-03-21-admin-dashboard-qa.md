# Admin Dashboard QA & UX Consistency — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix field completeness, validation, UX consistency, and admin workflows across all 16 React Admin resources in a layer-by-layer pass.

**Architecture:** Layer-by-layer approach — constants first (foundation for everything else), then missing fields, then validation, then modal-to-inline refactors, then workflow buttons and EditLog. Each layer is committed independently so progress is easy to review.

**Tech Stack:** React Admin, TypeScript, MUI (Material UI), Next.js 15 App Router. All changes are in `client/src/`. No backend changes except a data provider override for EditLog.

**Spec:** `docs/superpowers/specs/2026-03-21-admin-dashboard-qa-design.md`

---

## File Map

**Modified:**
- `client/src/lib/constants.ts` — add admin-specific enums (EVENT_TYPES, FACTION_ROLES, etc.)
- `client/src/components/admin/EditToolbar.tsx` — add `ApproveRejectToolbar` export
- `client/src/components/admin/AdminDataProvider.ts` — add EditLog `getList` override
- `client/src/app/admin/AdminApp.tsx` — register EditLog resource
- `client/src/components/admin/Users.tsx` — add `fluxerUsername` (Show), `profilePictureType` (Edit)
- `client/src/components/admin/Arcs.tsx` — add `order` to Edit/Create; circular parent validation; import constants
- `client/src/components/admin/Events.tsx` — add `rejectionReason` field; import constants
- `client/src/components/admin/Organizations.tsx` — switch description to RichMarkdownAdminInput
- `client/src/components/admin/Media.tsx` — add file metadata fields to Show; import constants
- `client/src/components/admin/Tags.tsx` — add usage count to Show
- `client/src/components/admin/Chapters.tsx` — duplicate number validation
- `client/src/components/admin/Volumes.tsx` — duplicate number validation
- `client/src/components/admin/Gambles.tsx` — fix chapterId/chapterNumber; replace FactionEditor with inline ArrayInput; import constants
- `client/src/components/admin/Quotes.tsx` — page/chapter validation
- `client/src/components/admin/Characters.tsx` — firstAppearanceChapter validation; replace RelationshipModalTrigger + OrgMembershipModalTrigger with inline forms; import constants
- `client/src/components/admin/Guides.tsx` — wire ApproveRejectToolbar; add bulk actions
- `client/src/components/admin/CharacterRelationships.tsx` — import constants
- `client/src/components/admin/Badges.tsx` — import constants (if hardcoded enums present)
- `client/src/components/admin/Annotations.tsx` — import constants (if hardcoded enums present)

**Created:**
- `client/src/components/admin/EditLog.tsx` — read-only EditLog list resource

---

## Task 1: Extend constants.ts + Update All Imports

**Files:**
- Modify: `client/src/lib/constants.ts`
- Modify: `client/src/components/admin/Characters.tsx`
- Modify: `client/src/components/admin/Gambles.tsx`
- Modify: `client/src/components/admin/Events.tsx`
- Modify: `client/src/components/admin/Media.tsx`
- Modify: `client/src/components/admin/Users.tsx`
- Modify: `client/src/components/admin/CharacterRelationships.tsx`

- [ ] **Step 1: Add admin constants to `client/src/lib/constants.ts`**

Append after the existing exports:

```ts
// Admin dashboard constants
export const EVENT_TYPES = [
  { id: 'gamble', name: 'Gamble' },
  { id: 'decision', name: 'Decision' },
  { id: 'reveal', name: 'Reveal' },
  { id: 'shift', name: 'Shift' },
  { id: 'resolution', name: 'Resolution' },
]

export const FACTION_ROLES = [
  { id: 'leader', name: 'Leader' },
  { id: 'member', name: 'Member' },
  { id: 'supporter', name: 'Supporter' },
  { id: 'observer', name: 'Observer' },
]

// Source: Characters.tsx local constant + CharacterRelationships.tsx RelationshipType enum
export const RELATIONSHIP_TYPE_VALUES = [
  'ally', 'rival', 'mentor', 'subordinate', 'family', 'partner', 'enemy', 'acquaintance'
]

// Source: MediaUsageType entity enum
export const MEDIA_USAGE_TYPES = [
  { id: 'character_image', name: 'Character Image' },
  { id: 'volume_image', name: 'Volume Image' },
  { id: 'volume_showcase_background', name: 'Volume Showcase Background' },
  { id: 'volume_showcase_popout', name: 'Volume Showcase Popout' },
  { id: 'guide_image', name: 'Guide Image' },
  { id: 'gallery_upload', name: 'Gallery Upload' },
]

// Source: ProfilePictureType entity enum
export const PROFILE_PICTURE_TYPES = [
  { id: 'fluxer', name: 'Fluxer Avatar' },
  { id: 'character_media', name: 'Character Media' },
  { id: 'exclusive_artwork', name: 'Exclusive Artwork' },
]

export const USER_ROLES = [
  { id: 'user', name: 'User' },
  { id: 'moderator', name: 'Moderator' },
  { id: 'editor', name: 'Editor' },
  { id: 'admin', name: 'Admin' },
]
```

> **Note:** React Admin `SelectInput` and `SelectArrayInput` `choices` prop expects `{ id, name }` objects. Format all constants this way so they're drop-in compatible.

- [ ] **Step 2: Update `Characters.tsx` — replace local `RELATIONSHIP_TYPES` with import**

Find the local constant at the top of `Characters.tsx` (around line 46):
```ts
const RELATIONSHIP_TYPES = [
  'ally', 'rival', 'mentor', 'subordinate', 'family', 'partner', 'enemy', 'acquaintance'
]
```

Replace with:
```ts
import { RELATIONSHIP_TYPE_VALUES } from '../../lib/constants'
```

Then update the two `{RELATIONSHIP_TYPES.map(...)}` usages in the `RelationshipModalTrigger` to use `RELATIONSHIP_TYPE_VALUES`.

- [ ] **Step 3: Update `Gambles.tsx` — replace hardcoded faction role arrays with import**

Find the hardcoded `['leader', 'member', 'supporter', 'observer']` array in `Gambles.tsx` and replace with `FACTION_ROLES` imported from `../../lib/constants`.

- [ ] **Step 4: Update `Events.tsx` — replace hardcoded event type array with import**

Find the hardcoded event type choices array in `Events.tsx` and replace with `EVENT_TYPES` imported from `../../lib/constants`.

- [ ] **Step 5: Update `Media.tsx` — replace hardcoded usage type array with import**

Find the hardcoded usage type choices in `Media.tsx` and replace with `MEDIA_USAGE_TYPES` imported from `../../lib/constants`.

- [ ] **Step 6: Update `Users.tsx` — replace hardcoded role array with import**

Find the hardcoded role choices in `Users.tsx` and replace with `USER_ROLES` imported from `../../lib/constants`.

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: build succeeds or only shows pre-existing errors (none introduced by this task).

- [ ] **Step 8: Commit**

```bash
cd client
git add src/lib/constants.ts src/components/admin/Characters.tsx src/components/admin/Gambles.tsx src/components/admin/Events.tsx src/components/admin/Media.tsx src/components/admin/Users.tsx src/components/admin/CharacterRelationships.tsx
git commit -m "refactor: centralize admin constants in lib/constants.ts"
```

---

## Task 2: Layer 1 — Add Missing Fields to Users Admin

**Files:**
- Modify: `client/src/components/admin/Users.tsx`

**Context:** `fluxerUsername` exists on the backend user record but is not displayed in the admin Show view. `profilePictureType` is a `ProfilePictureType` enum (`fluxer | character_media | exclusive_artwork`) that is not editable in the admin Edit form.

- [ ] **Step 1: Add `fluxerUsername` to `UserShow`**

Find the section in `UserShow` where `fluxerAvatar` is displayed (around the Fluxer info section). Add immediately after:

```tsx
<TextField source="fluxerUsername" label="Fluxer Username" emptyText="—" />
```

- [ ] **Step 2: Add `profilePictureType` to `UserEdit`**

In the `UserEdit` form (find where `isEmailVerified` `BooleanInput` is — around line 1232), add:

```tsx
import { PROFILE_PICTURE_TYPES } from '../../lib/constants'

// In the form:
<SelectInput
  source="profilePictureType"
  label="Profile Picture Type"
  choices={PROFILE_PICTURE_TYPES}
/>
```

- [ ] **Step 3: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/admin/Users.tsx
git commit -m "feat(admin): add fluxerUsername to UserShow, profilePictureType to UserEdit"
```

---

## Task 3: Layer 1 — Add Missing Fields to Arcs, Events, Organizations, Media, Tags

**Files:**
- Modify: `client/src/components/admin/Arcs.tsx`
- Modify: `client/src/components/admin/Events.tsx`
- Modify: `client/src/components/admin/Organizations.tsx`
- Modify: `client/src/components/admin/Media.tsx`
- Modify: `client/src/components/admin/Tags.tsx`

### Arcs — add `order` to Edit and Create forms

- [ ] **Step 1: Add `order` NumberInput to `ArcEdit`**

The `order` field already appears in `ArcShow`. Find `ArcEdit`'s `TabbedForm` or `SimpleForm` and add inside the main details tab/section:

```tsx
<NumberInput
  source="order"
  label="Order"
  helperText="Display order within the same parent arc (lower = first)"
  min={0}
/>
```

- [ ] **Step 2: Add `order` NumberInput to `ArcCreate`**

Same field, same placement in `ArcCreate`.

### Events — add `rejectionReason`

- [ ] **Step 3: Verify `rejectionReason` is absent from `EventEdit`**

Run: `grep -n "rejectionReason" client/src/components/admin/Events.tsx`

If the output is empty, proceed. If it already exists, skip Steps 4–5.

- [ ] **Step 4: Add `rejectionReason` to `EventEdit`**

Find where the `status` field is rendered in `EventEdit`. Add below it:

```tsx
<FormDataConsumer>
  {({ formData }) =>
    formData.status === 'rejected' && (
      <TextInput
        source="rejectionReason"
        label="Rejection Reason"
        multiline
        fullWidth
        helperText="Explain why this event was rejected"
      />
    )
  }
</FormDataConsumer>
```

- [ ] **Step 5: Add `rejectionReason` read-only display to `EventShow`**

In `EventShow`, add a read-only display of the rejection reason conditionally. Use a `FunctionField`:

```tsx
<FunctionField
  label="Rejection Reason"
  render={(record: any) =>
    record?.rejectionReason ? (
      <Typography variant="body2" color="error.main">{record.rejectionReason}</Typography>
    ) : null
  }
/>
```

### Organizations — switch description to RichMarkdownAdminInput

- [ ] **Step 6: Replace plain TextInput with RichMarkdownAdminInput in `OrganizationEdit` and `OrganizationCreate`**

Add import at the top of `Organizations.tsx`:
```tsx
import { RichMarkdownAdminInput } from '../RichMarkdownEditor/RichMarkdownAdminInput'
```

Find `<TextInput source="description" ...>` in both `OrganizationEdit` and `OrganizationCreate` and replace with:
```tsx
<RichMarkdownAdminInput source="description" label="Description" minHeight={150} />
```

### Media — add file metadata to `MediaShow`

- [ ] **Step 7: Add read-only file metadata fields to `MediaShow`**

Find the Show view in `Media.tsx` and add a "File Metadata" section with:

```tsx
<Typography variant="subtitle2" sx={{ mt: 2, mb: 1, opacity: 0.7 }}>File Metadata (read-only)</Typography>
<TextField source="fileName" label="File Name" emptyText="—" />
<TextField source="mimeType" label="MIME Type" emptyText="—" />
<NumberField source="fileSize" label="File Size (bytes)" emptyText="—" />
<NumberField source="width" label="Width (px)" emptyText="—" />
<NumberField source="height" label="Height (px)" emptyText="—" />
<TextField source="b2FileId" label="B2 File ID" emptyText="—" />
```

### Tags — add usage count to `TagShow`

- [ ] **Step 8: Add usage count FunctionField to `TagShow`**

The API may not return a usage count directly. Add a read-only display using `FunctionField` that checks for a `guideCount` or `_count` field if available, with a fallback:

```tsx
<FunctionField
  label="Usage Count"
  render={(record: any) => {
    const count = record?.guideCount ?? record?._count?.guides ?? '—'
    return <Typography variant="body2">{count}</Typography>
  }}
/>
```

> **Note:** If the backend API doesn't return usage counts, this field will show "—". That's acceptable — it makes the field available for when the API is extended.

- [ ] **Step 9: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 10: Commit**

```bash
git add client/src/components/admin/Arcs.tsx client/src/components/admin/Events.tsx client/src/components/admin/Organizations.tsx client/src/components/admin/Media.tsx client/src/components/admin/Tags.tsx
git commit -m "feat(admin): add missing fields to Arcs, Events, Organizations, Media, Tags"
```

---

## Task 4: Layer 2 — Arcs Circular Parent Validation

**Files:**
- Modify: `client/src/components/admin/Arcs.tsx`

**Context:** An arc can have a `parentId` pointing to another arc. We need to prevent an admin from selecting the arc itself or any of its descendants as its parent (which would create a circular reference).

- [ ] **Step 1: Add a `useGetList` call in `ArcEdit` to fetch all arcs for validation**

In the `ArcEdit` component, add:

```tsx
import { useGetList, useRecordContext } from 'react-admin'

// Inside the component or a sub-component wrapping the parentId field:
const ArcParentInput = () => {
  const record = useRecordContext()
  const { data: allArcs = [] } = useGetList('arcs', {
    pagination: { page: 1, perPage: 500 },
    sort: { field: 'name', order: 'ASC' },
  })

  // Build set of descendant IDs to exclude (simple BFS)
  const getDescendantIds = (arcId: number): Set<number> => {
    const result = new Set<number>()
    const queue = [arcId]
    while (queue.length > 0) {
      const current = queue.shift()!
      allArcs
        .filter((a: any) => a.parentId === current)
        .forEach((a: any) => {
          if (!result.has(a.id)) {
            result.add(a.id)
            queue.push(a.id)
          }
        })
    }
    return result
  }

  const forbiddenIds = record?.id
    ? new Set([record.id, ...getDescendantIds(record.id)])
    : new Set<number>()

  const parentChoices = allArcs.filter((a: any) => !forbiddenIds.has(a.id))

  return (
    <SelectInput
      source="parentId"
      label="Parent Arc"
      choices={parentChoices.map((a: any) => ({ id: a.id, name: a.name }))}
      allowEmpty
      emptyText="None (top-level arc)"
      helperText="Cannot select this arc or its descendants as parent"
    />
  )
}
```

- [ ] **Step 2: Replace the existing `parentId` input in `ArcEdit` with `<ArcParentInput />`**

Find the `parentId` SelectInput or ReferenceInput in `ArcEdit` and replace it with `<ArcParentInput />`.

- [ ] **Step 3: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/admin/Arcs.tsx
git commit -m "feat(admin): add circular parent arc validation in ArcEdit"
```

---

## Task 5: Layer 2 — Duplicate Number Validation for Chapters and Volumes

**Files:**
- Modify: `client/src/components/admin/Chapters.tsx`
- Modify: `client/src/components/admin/Volumes.tsx`

**Context:** React Admin doesn't provide async validation out of the box, but we can use the `validate` prop on individual inputs. Since we can't call the dataProvider inside a `validate` function cleanly, we'll use a warning helper text pattern instead — check for duplicates on blur using `useGetList`.

- [ ] **Step 1: Add duplicate chapter number warning to `ChapterEdit` and `ChapterCreate`**

Create a small wrapper component in `Chapters.tsx`:

```tsx
import { useGetList, useRecordContext, NumberInput } from 'react-admin'

const ChapterNumberInput = ({ isEdit = false }: { isEdit?: boolean }) => {
  const record = useRecordContext()
  const [value, setValue] = React.useState<number | undefined>(record?.number)
  const { data: existing = [] } = useGetList('chapters', {
    pagination: { page: 1, perPage: 1 },
    filter: { number: value },
  }, { enabled: value !== undefined })

  const isDuplicate = existing.length > 0 && (!isEdit || existing[0]?.id !== record?.id)

  return (
    <NumberInput
      source="number"
      label="Chapter Number"
      min={1}
      max={539}
      required
      onChange={(e: any) => setValue(e.target.value)}
      helperText={isDuplicate ? '⚠️ A chapter with this number already exists' : 'Chapter number (1–539)'}
      sx={isDuplicate ? { '& .MuiFormHelperText-root': { color: 'warning.main' } } : {}}
    />
  )
}
```

Replace the `number` `NumberInput` in both `ChapterEdit` and `ChapterCreate` with `<ChapterNumberInput isEdit={true} />` and `<ChapterNumberInput />` respectively.

- [ ] **Step 2: Apply the same pattern to `Volumes.tsx`**

Same approach — create `VolumeNumberInput` component checking for duplicate `number` values against the `volumes` resource.

- [ ] **Step 3: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 4: Commit**

```bash
git add client/src/components/admin/Chapters.tsx client/src/components/admin/Volumes.tsx
git commit -m "feat(admin): add duplicate number warnings to ChapterEdit and VolumeEdit"
```

---

## Task 6: Layer 2 — Validation for Gambles, Quotes, and Characters

**Files:**
- Modify: `client/src/components/admin/Gambles.tsx`
- Modify: `client/src/components/admin/Quotes.tsx`
- Modify: `client/src/components/admin/Characters.tsx`

### Gambles — verify and fix chapterId/chapterNumber mismatch

- [ ] **Step 1: Audit the Gamble Edit form's chapter field**

Run: `grep -n "chapterId\|chapterNumber\|chapter" client/src/components/admin/Gambles.tsx | head -20`

Check: is the form using `source="chapterId"` (expects a numeric FK) or `source="chapterNumber"` (expects the chapter number)? Check `AdminDataProvider.ts` line 70 — the allowed fields for gambles include `chapterId`. The form should use `source="chapterId"` with a `ReferenceInput` pointing to the `chapters` resource.

- [ ] **Step 2: Fix if mismatched**

If the form uses `chapterNumber` as a plain `NumberInput`:
```tsx
// Replace this:
<NumberInput source="chapterNumber" label="Chapter" />

// With this:
<ReferenceInput source="chapterId" reference="chapters" perPage={539}>
  <AutocompleteInput
    optionText={(record: any) => `Chapter ${record.number}${record.title ? ` — ${record.title}` : ''}`}
    label="Chapter"
    helperText="Select the chapter this gamble takes place in"
  />
</ReferenceInput>
```

If already using `chapterId` with a `ReferenceInput`, no change needed — just verify and skip.

### Quotes — add page and chapter validation

- [ ] **Step 3: Add validation to quote page number**

Find the page number `NumberInput` in `QuoteEdit` and `QuoteCreate`. Add `max={200}` and `min={1}`:

```tsx
<NumberInput
  source="pageNumber"
  label="Page Number"
  min={1}
  max={200}
  helperText="Page number within the chapter (1–200)"
/>
```

- [ ] **Step 4: Add chapter validation to quote chapter field**

Find the chapter `NumberInput` in `QuoteEdit` and `QuoteCreate`. Add:

```tsx
import { MAX_CHAPTER } from '../../lib/constants'

<NumberInput
  source="chapterNumber"
  label="Chapter Number"
  min={1}
  max={MAX_CHAPTER}
  helperText={`Chapter number (1–${MAX_CHAPTER})`}
/>
```

### Characters — verify firstAppearanceChapter validation

- [ ] **Step 5: Check current firstAppearanceChapter validation**

Run: `grep -n "firstAppearanceChapter" client/src/components/admin/Characters.tsx`

The field already exists. Verify it has `min={1} max={539}`. The grep earlier showed `max={539} min={1}` — if present, no change needed. If missing, add them.

- [ ] **Step 6: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components/admin/Gambles.tsx client/src/components/admin/Quotes.tsx client/src/components/admin/Characters.tsx
git commit -m "feat(admin): fix Gamble chapter field type, add Quotes page/chapter validation"
```

---

## Task 7: Layer 4 — ApproveRejectToolbar Shared Component

**Files:**
- Modify: `client/src/components/admin/EditToolbar.tsx`

**Context:** This shared component replaces the raw `SelectInput` status dropdown with Approve/Reject action buttons for Guides, Media, and Events. It reuses the existing `EditToolbar` styling.

- [ ] **Step 1: Add `ApproveRejectToolbar` to `EditToolbar.tsx`**

Add the following exports after the existing `EditToolbar` component:

```tsx
import { useUpdate, useNotify, useRefresh, useRecordContext, SaveButton, Toolbar, Button } from 'react-admin'
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField, Button as MuiButton, CircularProgress } from '@mui/material'
import { CheckCircle, XCircle } from 'lucide-react'

interface ApproveRejectToolbarProps {
  resource: string
  showDelete?: boolean
}

export const ApproveRejectToolbar: React.FC<ApproveRejectToolbarProps> = ({
  resource,
  showDelete = false,
}) => {
  const record = useRecordContext()
  const notify = useNotify()
  const refresh = useRefresh()
  const [rejectOpen, setRejectOpen] = React.useState(false)
  const [rejectionReason, setRejectionReason] = React.useState('')

  const [approve, { isPending: approving }] = useUpdate(
    resource,
    { id: record?.id, data: { status: 'approved' }, previousData: record },
    {
      onSuccess: () => {
        notify('Approved successfully', { type: 'success' })
        refresh()
      },
      onError: (error: any) => {
        notify(error?.message || 'Approval failed', { type: 'error' })
      },
    }
  )

  const [reject, { isPending: rejecting }] = useUpdate(
    resource,
    { id: record?.id, data: { status: 'rejected', rejectionReason }, previousData: record },
    {
      onSuccess: () => {
        notify('Rejected successfully', { type: 'success' })
        setRejectOpen(false)
        setRejectionReason('')
        refresh()
      },
      onError: (error: any) => {
        notify(error?.message || 'Rejection failed', { type: 'error' })
      },
    }
  )

  return (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0 0 8px 8px',
          p: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <SaveButton label="Save" variant="contained" />
          <MuiButton
            variant="contained"
            color="success"
            startIcon={approving ? <CircularProgress size={16} /> : <CheckCircle size={16} />}
            disabled={approving || rejecting}
            onClick={() => approve()}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Approve
          </MuiButton>
          <MuiButton
            variant="outlined"
            color="error"
            startIcon={<XCircle size={16} />}
            disabled={approving || rejecting}
            onClick={() => setRejectOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Reject
          </MuiButton>
        </Box>
        {showDelete && record?.id && (
          <DeleteButtonWithConfirmation resource={resource} size="medium" />
        )}
      </Toolbar>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject — provide a reason</DialogTitle>
        <DialogContent>
          <MuiTextField
            label="Rejection Reason"
            multiline
            rows={4}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            helperText="This reason will be shown to the submitter"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setRejectOpen(false)} disabled={rejecting}>Cancel</MuiButton>
          <MuiButton
            variant="contained"
            color="error"
            disabled={rejecting || !rejectionReason.trim()}
            onClick={() => reject()}
          >
            {rejecting ? <CircularProgress size={16} /> : 'Confirm Reject'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/admin/EditToolbar.tsx
git commit -m "feat(admin): add ApproveRejectToolbar shared component"
```

---

## Task 8: Layer 4 — Wire Approve/Reject to Guides, Media, Events + Bulk Actions

**Files:**
- Modify: `client/src/components/admin/Guides.tsx`
- Modify: `client/src/components/admin/Media.tsx`
- Modify: `client/src/components/admin/Events.tsx`

### Wire ApproveRejectToolbar to each resource

- [ ] **Step 1: Update `GuideEdit` to use `ApproveRejectToolbar`**

In `Guides.tsx`, import the new toolbar:
```tsx
import { ApproveRejectToolbar } from './EditToolbar'
```

Find the existing `<EditToolbar resource="guides" ...>` inside `GuideEdit` and replace with:
```tsx
<ApproveRejectToolbar resource="guides" showDelete={true} />
```

Also remove or hide the `status` `SelectInput` from the edit form (the toolbar now handles status changes via Approve/Reject buttons). Keep the field visible as a read-only `SelectField` in the form so admins can see current status at a glance.

- [ ] **Step 2: Same change for `MediaEdit` in `Media.tsx`**

```tsx
import { ApproveRejectToolbar } from './EditToolbar'
// In MediaEdit:
<ApproveRejectToolbar resource="media" showDelete={true} />
```

- [ ] **Step 3: Same change for `EventEdit` in `Events.tsx`**

```tsx
import { ApproveRejectToolbar } from './EditToolbar'
// In EventEdit:
<ApproveRejectToolbar resource="events" showDelete={false} />
```

### Add bulk approve/reject to Guides and Media list views

- [ ] **Step 4: Add bulk action buttons to `GuideList`**

Create bulk action components inside `Guides.tsx`:

```tsx
import { useUpdateMany, useNotify, useRefresh, useUnselectAll, BulkActionButton } from 'react-admin'

const BulkApproveButton = () => {
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('guides')
  const [updateMany, { isPending }] = useUpdateMany(
    'guides',
    { ids: [], data: { status: 'approved' } }, // ids injected by BulkActionButton
    {
      onSuccess: () => {
        notify('Selected guides approved', { type: 'success' })
        unselectAll()
        refresh()
      },
      onError: () => notify('Bulk approval failed', { type: 'error' }),
    }
  )
  return (
    <BulkActionButton onClick={() => updateMany()} label="Approve" disabled={isPending} />
  )
}

const BulkRejectButton = () => {
  // Same pattern but sets status: 'rejected'. For simplicity, no reason dialog in bulk mode.
  const notify = useNotify()
  const refresh = useRefresh()
  const unselectAll = useUnselectAll('guides')
  const [updateMany, { isPending }] = useUpdateMany(
    'guides',
    { ids: [], data: { status: 'rejected' } },
    {
      onSuccess: () => {
        notify('Selected guides rejected', { type: 'success' })
        unselectAll()
        refresh()
      },
      onError: () => notify('Bulk rejection failed', { type: 'error' }),
    }
  )
  return (
    <BulkActionButton onClick={() => updateMany()} label="Reject" disabled={isPending} />
  )
}
```

> **Note:** React Admin's `useUpdateMany` injects the selected IDs automatically when called from a `BulkActionButton` context. If the exact hook signature differs in this project's React Admin version, adjust accordingly — check the React Admin docs for the installed version.

In `GuideList`, add:
```tsx
<List
  bulkActionButtons={<><BulkApproveButton /><BulkRejectButton /></>}
  ...
>
```

- [ ] **Step 5: Same bulk actions for `MediaList` in `Media.tsx`**

Same pattern, replace `'guides'` with `'media'` and `unselectAll('guides')` with `unselectAll('media')`.

- [ ] **Step 6: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components/admin/Guides.tsx client/src/components/admin/Media.tsx client/src/components/admin/Events.tsx
git commit -m "feat(admin): wire ApproveRejectToolbar and bulk actions to Guides, Media, Events"
```

---

## Task 9: Layer 3 — Gamble FactionEditor Inline Refactor

**Files:**
- Modify: `client/src/components/admin/Gambles.tsx`
- Modify: `client/src/components/admin/AdminDataProvider.ts`

**Context:** The existing `FactionEditor` makes direct `api` calls bypassing the data provider. Before replacing it, we must confirm whether the backend gamble `GET /gambles/:id` returns factions as nested objects.

- [ ] **Step 1: Prerequisite — check gamble API response shape**

Run the dev server and inspect the gamble GET response, OR read the backend controller:

```bash
grep -n "factions\|getFactions\|GambleFaction" /Users/ninjaruss/Documents/GitHub/usogui-fansite/server/src/modules/gambles/gambles.service.ts | head -20
```

**Expected:** If factions are returned nested in the gamble record (e.g., `{ id: 1, name: '...', factions: [...] }`), proceed to Step 2.

**If NOT nested:** The backend would need to be updated OR the data provider needs to merge factions into the gamble record on `getOne`. This is a backend-touching change. If factions are not nested in the gamble response, **defer this task and note it for backend work**.

- [ ] **Step 2: If factions are nested — update `AdminDataProvider.ts` to pass factions through**

In `AdminDataProvider.ts`, find the `cleanUpdateData` function for `'gambles'` (around line 67). Add `'factions'` to the `allowedFields` array:

```ts
const allowedFields = [
  'name', 'description', 'rules', 'winCondition', 'explanation', 'chapterId', 'participantIds', 'factions'
]
```

This ensures faction data isn't stripped when saving.

- [ ] **Step 3: Replace `FactionEditor` modal with inline `ArrayInput` in `GambleEdit` and `GambleCreate`**

Remove the `FactionEditor` component and its modal dialog entirely. In its place, inside the edit/create form:

```tsx
import { ArrayInput, SimpleFormIterator, TextInput, SelectInput, ReferenceInput, AutocompleteInput } from 'react-admin'
import { FACTION_ROLES } from '../../lib/constants'

// Replace FactionEditor with:
<ArrayInput source="factions" label="Factions">
  <SimpleFormIterator inline={false}>
    <TextInput source="name" label="Faction Name" required />
    <ReferenceInput source="supportedGamblerId" reference="characters" perPage={200}>
      <AutocompleteInput
        label="Supported Gambler (optional)"
        optionText="name"
        allowEmpty
      />
    </ReferenceInput>
    <ArrayInput source="members" label="Members">
      <SimpleFormIterator inline>
        <ReferenceInput source="characterId" reference="characters" perPage={200}>
          <AutocompleteInput label="Character" optionText="name" />
        </ReferenceInput>
        <SelectInput source="role" label="Role" choices={FACTION_ROLES} defaultValue="member" />
      </SimpleFormIterator>
    </ArrayInput>
  </SimpleFormIterator>
</ArrayInput>
```

- [ ] **Step 4: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Manual data round-trip test**

With dev server running:
1. Open `/admin#/gambles` and edit an existing gamble
2. Add a new faction with 2 members
3. Save
4. Reload the page
5. Verify the faction and members persist correctly

- [ ] **Step 6: Commit**

```bash
git add client/src/components/admin/Gambles.tsx client/src/components/admin/AdminDataProvider.ts
git commit -m "feat(admin): replace Gamble FactionEditor modal with inline ArrayInput"
```

---

## Task 10: Layer 3 — Character Inline Trigger Refactors

**Files:**
- Modify: `client/src/components/admin/Characters.tsx`

**Context:** `RelationshipModalTrigger` (line ~50) and `OrgMembershipModalTrigger` (line ~194) are custom modal dialogs inside `Characters.tsx` that make direct `api` calls to create relationships/memberships. These are separate resources (`character-relationships`, `character-organizations`) and are NOT returned nested in the character record.

**Approach:** Rather than replacing with `ArrayInput` (which would require nested data), replace each modal with a React Admin `<ReferenceManyInput>` which manages related records via the data provider's standard create/delete operations. This keeps all data flowing through the data provider.

> **Note:** `ReferenceManyInput` requires React Admin v4.12+. Check the installed version: `grep '"react-admin"' client/package.json`. If the version is below 4.12, fall back to the existing modal approach and note this as out of scope.

- [ ] **Step 1: Check React Admin version**

```bash
grep '"react-admin"' client/package.json
```

If version is ≥ 4.12, proceed. Otherwise, skip to Step 6.

- [ ] **Step 2: Replace `RelationshipModalTrigger` with `ReferenceManyInput` in `CharacterEdit`**

Remove the `RelationshipModalTrigger` component definition (lines ~50–193 in Characters.tsx). In its place in the edit form (around line 742):

```tsx
import { ReferenceManyInput } from '@react-admin/ra-relationships'
// OR if using core react-admin 5.x:
import { ReferenceManyInput } from 'react-admin'

<ReferenceManyInput
  reference="character-relationships"
  target="sourceCharacterId"
  label="Relationships"
>
  <SimpleFormIterator>
    <ReferenceInput source="targetCharacterId" reference="characters" perPage={200}>
      <AutocompleteInput label="Target Character" optionText="name" />
    </ReferenceInput>
    <SelectInput
      source="relationshipType"
      label="Type"
      choices={RELATIONSHIP_TYPE_VALUES.map(t => ({ id: t, name: t }))}
    />
    <TextInput source="description" label="Description" multiline />
    <NumberInput source="startChapter" label="Start Chapter" min={1} max={MAX_CHAPTER} />
    <NumberInput source="endChapter" label="End Chapter" min={1} max={MAX_CHAPTER} />
    <NumberInput source="spoilerChapter" label="Spoiler Chapter" min={1} max={MAX_CHAPTER} />
  </SimpleFormIterator>
</ReferenceManyInput>
```

- [ ] **Step 3: Replace `OrgMembershipModalTrigger` with `ReferenceManyInput` in `CharacterEdit`**

Remove `OrgMembershipModalTrigger` component (lines ~194–340 approx). In its place (around line 913):

```tsx
<ReferenceManyInput
  reference="character-organizations"
  target="characterId"
  label="Organization Memberships"
>
  <SimpleFormIterator>
    <ReferenceInput source="organizationId" reference="organizations" perPage={200}>
      <AutocompleteInput label="Organization" optionText="name" />
    </ReferenceInput>
    <TextInput source="role" label="Role" />
    <NumberInput source="startChapter" label="Start Chapter" min={1} max={MAX_CHAPTER} />
    <NumberInput source="endChapter" label="End Chapter" min={1} max={MAX_CHAPTER} />
  </SimpleFormIterator>
</ReferenceManyInput>
```

- [ ] **Step 4: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Manual data round-trip test**

1. Open `/admin#/characters` and edit an existing character
2. Add a new relationship and a new org membership
3. Save
4. Reload the page
5. Verify both persist correctly

- [ ] **Step 6 (fallback — if ReferenceManyInput not available): Keep existing modals, just update RELATIONSHIP_TYPE_VALUES import**

If `ReferenceManyInput` is not available, the modal triggers stay but already use the centralized constant from Task 1. Mark this task as partially done and note in a comment that full inline refactor requires React Admin ≥ 4.12.

- [ ] **Step 7: Commit**

```bash
git add client/src/components/admin/Characters.tsx
git commit -m "feat(admin): replace Character relationship/org modal triggers with ReferenceManyInput"
```

---

## Task 11: Layer 4 — EditLog Read-Only Resource

**Files:**
- Create: `client/src/components/admin/EditLog.tsx`
- Modify: `client/src/components/admin/AdminDataProvider.ts`
- Modify: `client/src/app/admin/AdminApp.tsx`

**Context:** The backend `GET /edit-log/recent` endpoint accepts `page`, `limit`, `entityType` query params and returns `{ data: [...], total: number }`. We need to map React Admin's `getList` call to this endpoint.

### Update AdminDataProvider

- [ ] **Step 1: Add EditLog `getList` override to `AdminDataProvider.ts`**

Find the `getList` implementation in `AdminDataProvider.ts`. Add a resource-specific branch for `'edit-log'`:

```ts
// Inside getList, before the default implementation:
if (resource === 'edit-log') {
  const { page, perPage } = params.pagination
  const { entityType } = params.filter || {}
  const query: Record<string, string | number> = { page, limit: perPage }
  if (entityType) query.entityType = entityType

  const response = await api.get('/edit-log/recent', { params: query })
  // Backend returns { data: [...], total: number } OR an array with total in header
  // Adjust based on actual response shape:
  const items = Array.isArray(response.data) ? response.data : response.data?.data ?? []
  const total = response.data?.total ?? items.length
  return {
    data: items.map((item: any) => ({ ...item, id: item.id ?? `${item.entityType}-${item.entityId}-${item.createdAt}` })),
    total,
  }
}
```

> **Adjustment needed:** Inspect the actual response from `GET /edit-log/recent` to confirm the shape. The edit-log service `getRecent` method returns paginated results — check `edit-log.service.ts` for the exact return shape.

### Create EditLog resource component

- [ ] **Step 2: Create `client/src/components/admin/EditLog.tsx`**

```tsx
'use client'

import React from 'react'
import {
  List,
  Datagrid,
  TextField,
  DateField,
  ReferenceField,
  SelectInput,
  FunctionField,
  useRecordContext,
} from 'react-admin'
import { Chip, Typography } from '@mui/material'

const EntityTypeFilter = [
  <SelectInput
    key="entityType"
    source="entityType"
    label="Entity Type"
    choices={[
      { id: 'character', name: 'Character' },
      { id: 'gamble', name: 'Gamble' },
      { id: 'arc', name: 'Arc' },
      { id: 'organization', name: 'Organization' },
      { id: 'event', name: 'Event' },
      { id: 'guide', name: 'Guide' },
    ]}
    alwaysOn
  />,
]

const ChangedFieldsDisplay = () => {
  const record = useRecordContext()
  if (!record?.changedFields) return null
  const fields = typeof record.changedFields === 'string'
    ? JSON.parse(record.changedFields)
    : record.changedFields
  const keys = Object.keys(fields || {})
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {keys.slice(0, 5).map(k => (
        <Chip key={k} label={k} size="small" variant="outlined" />
      ))}
      {keys.length > 5 && (
        <Typography variant="caption" sx={{ alignSelf: 'center' }}>+{keys.length - 5} more</Typography>
      )}
    </div>
  )
}

export const EditLogList = () => (
  <List
    filters={EntityTypeFilter}
    sort={{ field: 'createdAt', order: 'DESC' }}
    perPage={25}
    exporter={false}
  >
    <Datagrid bulkActionButtons={false} rowClick={false}>
      <DateField source="createdAt" label="Timestamp" showTime />
      <TextField source="entityType" label="Entity Type" />
      <TextField source="entityId" label="Entity ID" />
      <TextField source="action" label="Action" />
      <FunctionField label="Changed Fields" render={() => <ChangedFieldsDisplay />} />
      <ReferenceField source="userId" reference="users" label="Acting User" link={false}>
        <TextField source="username" />
      </ReferenceField>
    </Datagrid>
  </List>
)
```

### Register in AdminApp

- [ ] **Step 3: Add EditLog resource to `AdminApp.tsx`**

```tsx
import { EditLogList } from '../../components/admin/EditLog'
import { ClipboardList } from 'lucide-react'
const ClipboardListIcon = () => <ClipboardList />

// In the <Admin> block, add:
<Resource
  name="edit-log"
  list={EditLogList}
  icon={ClipboardListIcon}
  options={{ label: 'Edit Log' }}
/>
```

- [ ] **Step 4: Verify build**

```bash
cd client && yarn build 2>&1 | grep -E "error|Error" | head -20
```

- [ ] **Step 5: Manual smoke test**

1. Open `/admin#/edit-log`
2. Verify the list loads with entries
3. Verify timestamp, entity type, entity ID, action, and acting user display correctly

- [ ] **Step 6: Commit**

```bash
git add client/src/components/admin/EditLog.tsx client/src/components/admin/AdminDataProvider.ts client/src/app/admin/AdminApp.tsx
git commit -m "feat(admin): add read-only EditLog resource with data provider override"
```

---

## Task 12: Final Verification

- [ ] **Step 1: Full build**

```bash
cd client && yarn build
```

Expected: exits with code 0, no TypeScript errors.

- [ ] **Step 2: Lint**

```bash
cd client && yarn lint
```

Expected: no errors (warnings acceptable if pre-existing).

- [ ] **Step 3: Manual browser spot-check checklist**

With dev server running (`cd client && yarn dev`), verify each changed resource:

| Resource | Check |
|---|---|
| Users | Show view has `fluxerUsername`; Edit form has `profilePictureType` dropdown |
| Arcs | Edit/Create forms have `order` field; parent dropdown excludes self and descendants |
| Events | Edit form shows `rejectionReason` when status = rejected |
| Organizations | Description uses rich markdown editor |
| Media | Show view displays file metadata fields |
| Tags | Show view displays usage count |
| Chapters | Warning shows when chapter number already exists |
| Volumes | Warning shows when volume number already exists |
| Gambles | Chapter field uses autocomplete reference; factions use inline editor (if nested) |
| Quotes | Page number max 200; chapter max 539 |
| Guides | Toolbar has Approve/Reject buttons; list has bulk approve/reject |
| Media | Toolbar has Approve/Reject buttons; list has bulk approve/reject |
| Events | Toolbar has Approve/Reject buttons |
| Characters | Relationship and org modals replaced with inline forms (if RA version supports) |
| Edit Log | `/admin#/edit-log` loads and shows recent edits |

- [ ] **Step 4: Final commit if any loose ends**

```bash
git add -A
git commit -m "chore(admin): final cleanup and verification pass"
```
