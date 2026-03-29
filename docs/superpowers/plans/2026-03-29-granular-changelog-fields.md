# Granular Changelog Fields — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the changelog/activity feed show only fields that actually changed, with human-readable labels.

**Architecture:** A shared `diffFields` utility on the backend compares entity snapshots to incoming DTOs and returns only keys where values differ. Nine services are updated to call this utility before mutating entities. The frontend `ChangelogPageContent` gains a `FIELD_LABELS` map so raw camelCase keys render as readable labels.

**Tech Stack:** NestJS, TypeORM, TypeScript (backend); Next.js 15, React, Mantine UI (frontend)

---

## File Map

**Created:**
- `server/src/common/utils/diff-fields.ts` — `diffFields<T>(before, update)` utility
- `server/src/common/utils/diff-fields.spec.ts` — unit tests

**Modified (backend):**
- `server/src/modules/characters/characters.service.ts` — use `diffFields` before `Object.assign`
- `server/src/modules/arcs/arcs.service.ts` — same
- `server/src/modules/chapters/chapters.service.ts` — same
- `server/src/modules/organizations/organizations.service.ts` — same
- `server/src/modules/tags/tags.service.ts` — same
- `server/src/modules/character-relationships/character-relationships.service.ts` — same (already before assign)
- `server/src/modules/character-organizations/character-organizations.service.ts` — same (already before assign)
- `server/src/modules/events/events.service.ts` — snapshot before mutations, use `diffFields`
- `server/src/modules/gambles/gambles.service.ts` — snapshot scalars before mutations, use `diffFields`
- `server/src/modules/annotations/annotations.service.ts` — use `diffFields` on `rest`, compare spoiler fields manually
- `server/src/modules/guides/guides.service.ts` — use `diffFields` for guide scalar fields
- `server/src/modules/media/media.service.ts` — use `diffFields` for media scalar fields

**Modified (frontend):**
- `client/src/app/changelog/ChangelogPageContent.tsx` — add `FIELD_LABELS`, `labelField`, update `formatChangedFields`

---

## Task 1: `diffFields` utility

**Files:**
- Create: `server/src/common/utils/diff-fields.spec.ts`
- Create: `server/src/common/utils/diff-fields.ts`

- [ ] **Step 1: Write the failing tests**

Create `server/src/common/utils/diff-fields.spec.ts`:

```ts
import { diffFields } from './diff-fields';

describe('diffFields', () => {
  it('returns keys where primitive value changed', () => {
    const before = { name: 'Baku', status: 'active' };
    const update = { name: 'Kaiji', status: 'active' };
    expect(diffFields(before, update)).toEqual(['name']);
  });

  it('returns empty array when nothing changed', () => {
    const before = { name: 'Baku', status: 'active' };
    const update = { name: 'Baku', status: 'active' };
    expect(diffFields(before, update)).toEqual([]);
  });

  it('skips keys with undefined value in update', () => {
    const before = { name: 'Baku', status: 'active' };
    const update = { name: 'Kaiji', status: undefined };
    expect(diffFields(before, update)).toEqual(['name']);
  });

  it('detects changed arrays via JSON comparison', () => {
    const before = { tags: [1, 2] };
    const update = { tags: [1, 3] };
    expect(diffFields(before, update)).toEqual(['tags']);
  });

  it('ignores arrays that are identical', () => {
    const before = { tags: [1, 2] };
    const update = { tags: [1, 2] };
    expect(diffFields(before, update)).toEqual([]);
  });

  it('detects changed nested objects', () => {
    const before = { meta: { foo: 1 } };
    const update = { meta: { foo: 2 } };
    expect(diffFields(before, update)).toEqual(['meta']);
  });

  it('handles null values', () => {
    const before = { summary: 'text' };
    const update = { summary: null };
    expect(diffFields(before, update)).toEqual(['summary']);
  });

  it('handles keys not present on before entity', () => {
    const before = { name: 'Baku' };
    const update = { name: 'Baku', newField: 'hello' };
    expect(diffFields(before as any, update)).toEqual(['newField']);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd server && yarn test --testPathPattern=diff-fields --no-coverage
```

Expected: FAIL — `Cannot find module './diff-fields'`

- [ ] **Step 3: Implement the utility**

Create `server/src/common/utils/diff-fields.ts`:

```ts
/**
 * Returns the keys from `update` where the value differs from `before`.
 * - Primitives compared with `===`
 * - Arrays and objects compared with `JSON.stringify`
 * - Keys with `undefined` value in `update` are skipped
 */
export function diffFields<T extends object>(
  before: T,
  update: Partial<T>,
): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(update)) {
    const val = (update as any)[key];
    if (val === undefined) continue;
    const oldVal = (before as any)[key];
    if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(val)) changed.push(key);
    } else if (oldVal !== val) {
      changed.push(key);
    }
  }
  return changed;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd server && yarn test --testPathPattern=diff-fields --no-coverage
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
cd server && git add src/common/utils/diff-fields.ts src/common/utils/diff-fields.spec.ts
git commit -m "feat: add diffFields utility for changelog accuracy"
```

---

## Task 2: Update wiki services — characters, arcs, chapters, organizations, tags

These five services share the same pattern:
1. Entity is loaded via `findOne`
2. `Object.assign(entity, data)` mutates the entity
3. Entity is saved
4. `changedFields` is computed from DTO keys **after** mutation

The fix: move `diffFields(entity, data)` **before** `Object.assign`.

**Files:**
- Modify: `server/src/modules/characters/characters.service.ts` (~line 183–200)
- Modify: `server/src/modules/arcs/arcs.service.ts` (~line 130–149)
- Modify: `server/src/modules/chapters/chapters.service.ts` (~line 94–112)
- Modify: `server/src/modules/organizations/organizations.service.ts` (~line 121–132)
- Modify: `server/src/modules/tags/tags.service.ts` (~line 81–99)

- [ ] **Step 1: Add import and update characters.service.ts**

Add import at top of `server/src/modules/characters/characters.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

In the `update` method, replace:
```ts
Object.assign(character, characterData);
if (!isMinorEdit) {
  character.isVerified = false;
  character.verifiedById = null;
  character.verifiedAt = null;
}
const saved = await this.repo.save(character);
const changedFields = Object.keys(characterData).filter(
  (k) => characterData[k as keyof typeof characterData] !== undefined,
);
```
with:
```ts
const changedFields = diffFields(character, characterData);
Object.assign(character, characterData);
if (!isMinorEdit) {
  character.isVerified = false;
  character.verifiedById = null;
  character.verifiedAt = null;
}
const saved = await this.repo.save(character);
```

- [ ] **Step 2: Update arcs.service.ts**

Add import at top of `server/src/modules/arcs/arcs.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

In the `update` method, replace:
```ts
Object.assign(entity, data);
if (!isMinorEdit) {
  entity.isVerified = false;
  entity.verifiedById = null;
  entity.verifiedAt = null;
}
const saved = await this.repo.save(entity);
const changedFields = Object.keys(data).filter(
  (k) => data[k as keyof typeof data] !== undefined,
);
```
with:
```ts
const changedFields = diffFields(entity, data);
Object.assign(entity, data);
if (!isMinorEdit) {
  entity.isVerified = false;
  entity.verifiedById = null;
  entity.verifiedAt = null;
}
const saved = await this.repo.save(entity);
```

- [ ] **Step 3: Update chapters.service.ts**

Add import at top of `server/src/modules/chapters/chapters.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

In the `update` method, replace:
```ts
Object.assign(entity, data);
if (!isMinorEdit) {
  entity.isVerified = false;
  entity.verifiedById = null;
  entity.verifiedAt = null;
}
const saved = await this.repo.save(entity);
const changedFields = Object.keys(data).filter(
  (k) => data[k as keyof typeof data] !== undefined,
);
```
with:
```ts
const changedFields = diffFields(entity, data);
Object.assign(entity, data);
if (!isMinorEdit) {
  entity.isVerified = false;
  entity.verifiedById = null;
  entity.verifiedAt = null;
}
const saved = await this.repo.save(entity);
```

- [ ] **Step 4: Update organizations.service.ts**

Add import at top of `server/src/modules/organizations/organizations.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

In the `update` method, replace:
```ts
const changedFields = Object.keys(data).filter(
  (k) => data[k as keyof typeof data] !== undefined,
);
await this.editLogService.logUpdate(
```
with:
```ts
const changedFields = diffFields(entity, data);
await this.editLogService.logUpdate(
```

Note: `organizations.service.ts` already computes `changedFields` before save — verify with `findOne` that `entity` is the loaded entity variable. The `diffFields` call just replaces the `Object.keys` filter.

- [ ] **Step 5: Update tags.service.ts**

Add import at top of `server/src/modules/tags/tags.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

In the `update` method, replace:
```ts
Object.assign(tag, data);
if (!isMinorEdit) {
  tag.isVerified = false;
  tag.verifiedById = null;
  tag.verifiedAt = null;
}
const saved = await this.repo.save(tag);
const changedFields = Object.keys(data).filter(
  (k) => data[k as keyof typeof data] !== undefined,
);
```
with:
```ts
const changedFields = diffFields(tag, data);
Object.assign(tag, data);
if (!isMinorEdit) {
  tag.isVerified = false;
  tag.verifiedById = null;
  tag.verifiedAt = null;
}
const saved = await this.repo.save(tag);
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no TypeScript errors

- [ ] **Step 7: Commit**

```bash
cd server && git add \
  src/modules/characters/characters.service.ts \
  src/modules/arcs/arcs.service.ts \
  src/modules/chapters/chapters.service.ts \
  src/modules/organizations/organizations.service.ts \
  src/modules/tags/tags.service.ts
git commit -m "feat: use diffFields in wiki services (characters, arcs, chapters, orgs, tags)"
```

---

## Task 3: Update relationship services

These two services already compute `changedFields` **before** `Object.assign`, so the fix is a simpler substitution.

**Files:**
- Modify: `server/src/modules/character-relationships/character-relationships.service.ts` (~line 328)
- Modify: `server/src/modules/character-organizations/character-organizations.service.ts` (~line 210)

- [ ] **Step 1: Update character-relationships.service.ts**

Add import at top:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

Replace:
```ts
const changedFields = Object.keys(dto);
Object.assign(relationship, dto);
```
with:
```ts
const changedFields = diffFields(relationship, dto);
Object.assign(relationship, dto);
```

- [ ] **Step 2: Update character-organizations.service.ts**

Add import at top:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

Replace:
```ts
const changedFields = Object.keys(dto);

// Update fields
Object.assign(membership, dto);
```
with:
```ts
const changedFields = diffFields(membership, dto);

// Update fields
Object.assign(membership, dto);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd server && git add \
  src/modules/character-relationships/character-relationships.service.ts \
  src/modules/character-organizations/character-organizations.service.ts
git commit -m "feat: use diffFields in relationship services"
```

---

## Task 4: Update events service

The events service builds `changedFields` after `await this.repo.save(event)` — the entity is mutated before the diff. We need to snapshot before mutation. The service also manually pushes `'characters'` for many-to-many relation changes.

**Files:**
- Modify: `server/src/modules/events/events.service.ts` (~line 455–473)

- [ ] **Step 1: Add import**

Add at top of `server/src/modules/events/events.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

- [ ] **Step 2: Snapshot entity and compute diff before mutations**

Locate the `update` method. Find the section where `const result = await this.findOne(id)` is called after save. The entity loaded for update is `event` (loaded near the top of the method).

Before the section that mutates and saves `event`, add the snapshot. The existing code pattern is:
```ts
const changedFields = Object.keys(updateData).filter(
  (k) => updateData[k as keyof typeof updateData] !== undefined,
);
if (characterIds !== undefined) changedFields.push('characters');
await this.editLogService.logUpdate(
  EditLogEntityType.EVENT,
  id,
  userId,
  changedFields,
);
```

Replace with:
```ts
const changedFields = diffFields(event, updateData);
if (characterIds !== undefined) changedFields.push('characters');
await this.editLogService.logUpdate(
  EditLogEntityType.EVENT,
  id,
  userId,
  changedFields,
);
```

Note: At the point where `changedFields` is computed, `event` has already been mutated by `Object.assign` or manual field assignments earlier in the method. Locate where `event` is first loaded (it will be a `findOne` call near the top of `update`) and move the `diffFields` call to immediately after that load, before any mutations. Store in `changedFields` there, and remove the old computation.

Find the event load line (looks like `const event = await this.repo.findOne(...)`) and add immediately after:
```ts
const changedFields = diffFields(event, updateData);
if (characterIds !== undefined) changedFields.push('characters');
```

Then delete the old `changedFields` computation block near the `logUpdate` call.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd server && git add src/modules/events/events.service.ts
git commit -m "feat: use diffFields in events service"
```

---

## Task 5: Update gambles service

The gambles service manually assigns scalar fields with `??`, saves, then handles factions separately. The `changedFields` computation happens after all mutations. We snapshot the scalar fields before mutations.

**Files:**
- Modify: `server/src/modules/gambles/gambles.service.ts` (~line 189–247)

- [ ] **Step 1: Add import**

Add at top of `server/src/modules/gambles/gambles.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

- [ ] **Step 2: Snapshot and compute diff before mutations**

In the `update` method, `gamble` is loaded via `const gamble = await this.findOne(id)`. Immediately after this line, before any field assignments, add:

```ts
// Snapshot scalar fields before mutation for accurate diffing
const scalarSnapshot = {
  name: gamble.name,
  description: gamble.description,
  rules: gamble.rules,
  winCondition: gamble.winCondition,
  explanation: gamble.explanation,
  chapterId: gamble.chapterId,
};
const scalarDto = {
  name: updateGambleDto.name,
  description: updateGambleDto.description,
  rules: updateGambleDto.rules,
  winCondition: updateGambleDto.winCondition,
  explanation: updateGambleDto.explanation,
  chapterId: updateGambleDto.chapterId,
};
const changedFields = diffFields(scalarSnapshot, scalarDto);
if (updateGambleDto.participantIds !== undefined) changedFields.push('participants');
if (updateGambleDto.factions !== undefined) changedFields.push('factions');
```

Then replace the existing `changedFields` computation:
```ts
const changedFields = Object.keys(updateGambleDto).filter(
  (k) => updateGambleDto[k as keyof UpdateGambleDto] !== undefined,
);
```
with nothing (delete it, since `changedFields` is now computed above).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd server && git add src/modules/gambles/gambles.service.ts
git commit -m "feat: use diffFields in gambles service"
```

---

## Task 6: Update annotations service

The annotations service destructures the DTO into `{isSpoiler, spoilerChapter, ...rest}` and calls `Object.assign(annotation, rest)`. The `changedFields` is computed after save. We use `diffFields` on `rest` before the `Object.assign`, and compare spoiler fields manually.

**Files:**
- Modify: `server/src/modules/annotations/annotations.service.ts` (~line 331–361)

- [ ] **Step 1: Add import**

Add at top of `server/src/modules/annotations/annotations.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

- [ ] **Step 2: Move changedFields computation before mutations**

The current code (at the destructure line onward):
```ts
const { isSpoiler, spoilerChapter, ...rest } = updateAnnotationDto;

// Handle spoiler logic
if (isSpoiler !== undefined) { ... }
else if (spoilerChapter !== undefined) { ... }

Object.assign(annotation, rest);

const saved = await this.annotationRepository.save(annotation);

const changedFields = Object.keys(rest);
if (isSpoiler !== undefined) changedFields.push('isSpoiler');
if (spoilerChapter !== undefined) changedFields.push('spoilerChapter');
```

Replace the `changedFields` computation after save with a pre-mutation version:

```ts
const { isSpoiler, spoilerChapter, ...rest } = updateAnnotationDto;

// Compute changedFields before mutation
const changedFields = diffFields(annotation, rest);
if (isSpoiler !== undefined && isSpoiler !== annotation.isSpoiler) changedFields.push('isSpoiler');
if (spoilerChapter !== undefined && spoilerChapter !== annotation.spoilerChapter) changedFields.push('spoilerChapter');

// Handle spoiler logic (unchanged)
if (isSpoiler !== undefined) { ... }
else if (spoilerChapter !== undefined) { ... }

Object.assign(annotation, rest);

const saved = await this.annotationRepository.save(annotation);
// remove old changedFields lines here
```

The `logUpdate` call stays unchanged:
```ts
await this.editLogService.logUpdate(
  EditLogEntityType.ANNOTATION,
  annotation.id,
  currentUser.id,
  [...changedFields, `priorStatus:${priorStatus}`],
);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd server && git add src/modules/annotations/annotations.service.ts
git commit -m "feat: use diffFields in annotations service"
```

---

## Task 7: Update guides service

The guides service runs the update inside a transaction. The guide is loaded inside the transaction via `guideRepo.findOne`. We load the guide once before the transaction to snapshot its scalar fields for diffing.

**Files:**
- Modify: `server/src/modules/guides/guides.service.ts` (~line 739–750)

- [ ] **Step 1: Add import**

Add at top of `server/src/modules/guides/guides.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

- [ ] **Step 2: Load guide before transaction for snapshot**

The existing `changedFields` computation after the transaction:
```ts
// Log the edit
const changedFieldNames = Object.keys(guideData).filter(
  (k) => k !== 'tagNames' && k !== 'characterIds',
);
if (tagNames !== undefined) changedFieldNames.push('tags');
if (characterIds !== undefined) changedFieldNames.push('characters');
await this.editLogService.logUpdate(
  EditLogEntityType.GUIDE,
  guide.id,
  currentUser.id,
  [...changedFieldNames, `priorStatus:${priorStatus}`],
);
```

Find where `guide` is first loaded before the transaction (there should be a `findOne` call before the `await this.dataSource.transaction(...)` block to get `guide.id` and `priorStatus`). Use that snapshot for diffing. Replace the `changedFieldNames` computation:

```ts
// Log the edit — diff scalar fields against pre-transaction snapshot
const scalarGuideData = Object.fromEntries(
  Object.entries(guideData).filter(([k]) => k !== 'tagNames' && k !== 'characterIds'),
);
const changedFieldNames = diffFields(guide, scalarGuideData);
if (tagNames !== undefined) changedFieldNames.push('tags');
if (characterIds !== undefined) changedFieldNames.push('characters');
await this.editLogService.logUpdate(
  EditLogEntityType.GUIDE,
  guide.id,
  currentUser.id,
  [...changedFieldNames, `priorStatus:${priorStatus}`],
);
```

Note: `guide` here is the entity loaded **before** the transaction. Verify `guide` is in scope at this point. If the pre-transaction variable has a different name, adjust accordingly.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd server && git add src/modules/guides/guides.service.ts
git commit -m "feat: use diffFields in guides service"
```

---

## Task 8: Update media service

The media service manually builds `changedFieldNames` by checking each field individually. Replace with `diffFields` on a snapshot of the relevant scalar fields.

**Files:**
- Modify: `server/src/modules/media/media.service.ts` (~line 631–656)

- [ ] **Step 1: Add import**

Add at top of `server/src/modules/media/media.service.ts`:
```ts
import { diffFields } from '../../common/utils/diff-fields';
```

- [ ] **Step 2: Replace manual changedFieldNames computation**

The existing code (after save):
```ts
const changedFieldNames: string[] = [];
if (updateData.description !== undefined) changedFieldNames.push('description');
if (updateData.ownerType !== undefined) changedFieldNames.push('ownerType');
if (updateData.ownerId !== undefined) changedFieldNames.push('ownerId');
if (updateData.chapterNumber !== undefined) changedFieldNames.push('chapterNumber');
if (updateData.url !== undefined && !file) changedFieldNames.push('url');
if (file) changedFieldNames.push('file');

await this.editLogService.logUpdate(
  EditLogEntityType.MEDIA,
  media.id,
  user.id,
  [...changedFieldNames, `priorStatus:${priorStatus}`],
);
```

`media` is loaded before this block. Replace with a snapshot before the mutation (`media.status = MediaStatus.PENDING` etc.) and diff after. Find where `media` is loaded (before any status/field mutations) and add a snapshot. Since the status is reset conditionally, snapshot the scalar fields we care about:

```ts
// Snapshot before mutations (status may have been reset above)
const mediaSnapshot = {
  description: media.description,
  ownerType: media.ownerType,
  ownerId: media.ownerId,
  chapterNumber: media.chapterNumber,
  url: media.url,
};
const mediaDtoScalars = {
  description: updateData.description,
  ownerType: updateData.ownerType,
  ownerId: updateData.ownerId,
  chapterNumber: updateData.chapterNumber,
  url: !file ? updateData.url : undefined,
};
const changedFieldNames = diffFields(mediaSnapshot, mediaDtoScalars);
if (file) changedFieldNames.push('file');
```

Place this snapshot **before** any mutations to `media` fields in the update method. Remove the old manual `changedFieldNames` block.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && yarn build 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd server && git add src/modules/media/media.service.ts
git commit -m "feat: use diffFields in media service"
```

---

## Task 9: Frontend field label map

**Files:**
- Modify: `client/src/app/changelog/ChangelogPageContent.tsx`

- [ ] **Step 1: Add FIELD_LABELS and labelField helper**

After the existing imports in `ChangelogPageContent.tsx`, before the `FilterType` type declaration, add:

```ts
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Title',
  summary: 'Summary',
  description: 'Description',
  imageUrl: 'Image URL',
  status: 'Status',
  tags: 'Tags',
  type: 'Type',
  startChapter: 'Start Chapter',
  endChapter: 'End Chapter',
  outcome: 'Outcome',
  rules: 'Rules',
  winCondition: 'Win Condition',
  explanation: 'Explanation',
  factions: 'Factions',
  participants: 'Participants',
  characters: 'Characters',
  organizations: 'Organizations',
  strategies: 'Strategies',
  isCanon: 'Is Canon',
  number: 'Number',
  arcId: 'Arc',
  volumeId: 'Volume',
  chapterId: 'Chapter',
  chapterNumber: 'Chapter Number',
  relationshipType: 'Relationship Type',
  sourceCharacterId: 'Character',
  targetCharacterId: 'Related Character',
  organizationId: 'Organization',
  roleInGamble: 'Role',
  notes: 'Notes',
  content: 'Content',
  fileName: 'File Name',
  ownerType: 'Owner Type',
  ownerId: 'Owner',
  url: 'URL',
  file: 'File',
  isSpoiler: 'Spoiler Flag',
  spoilerChapter: 'Spoiler Chapter',
  isVerified: 'Verified',
}

function labelField(field: string): string {
  return (
    FIELD_LABELS[field] ??
    field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (c) => c.toUpperCase())
      .trim()
  )
}
```

- [ ] **Step 2: Update formatChangedFields to use labelField**

Replace the existing `formatChangedFields` function:
```ts
function formatChangedFields(fields: string[] | null | undefined): string {
  if (!fields?.length) return ''
  const filtered = fields.filter(f => !f.startsWith('priorStatus:'))
  if (!filtered.length) return ''
  const shown = filtered.slice(0, 4).map(f => f.charAt(0).toUpperCase() + f.slice(1))
  const rest = filtered.length - 4
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
}
```

with:
```ts
function formatChangedFields(fields: string[] | null | undefined): string {
  if (!fields?.length) return ''
  const filtered = fields.filter((f) => !f.startsWith('priorStatus:'))
  if (!filtered.length) return ''
  const shown = filtered.slice(0, 4).map(labelField)
  const rest = filtered.length - 4
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ')
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: successful build, no TypeScript errors

- [ ] **Step 4: Commit**

```bash
cd client && git add src/app/changelog/ChangelogPageContent.tsx
git commit -m "feat: human-readable field labels in changelog"
```

---

## Final Verification

- [ ] **Run all server tests**

```bash
cd server && yarn test --no-coverage 2>&1 | tail -20
```

Expected: all tests pass (including the new `diff-fields.spec.ts`)

- [ ] **Run server lint**

```bash
cd server && yarn lint 2>&1 | tail -20
```

Expected: no lint errors

- [ ] **Run client lint**

```bash
cd client && yarn lint 2>&1 | tail -20
```

Expected: no lint errors
