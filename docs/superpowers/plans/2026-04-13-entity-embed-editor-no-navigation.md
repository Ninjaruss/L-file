# Entity Embed Editor No-Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent entity embed chips inside the rich text editor from navigating to a new page when clicked.

**Architecture:** Add a `disableNavigation` boolean prop to `EntityCard`. When true and rendering in inline chip mode, swap the `<Link>` wrapper for a visually identical `<span>`. Pass `disableNavigation` from the editor's `EntityEmbedNodeView`. No event propagation hacks — clicks bubble normally so ProseMirror can still select the node.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tiptap, Mantine UI

---

## File Map

| File | Change |
|------|--------|
| `client/src/components/EntityCard.tsx` | Add `disableNavigation?: boolean` prop; swap `<Link>` → `<span>` in inline branch when true |
| `client/src/components/RichMarkdownEditor/index.tsx` | Pass `disableNavigation` to `EntityCard` inside `EntityEmbedNodeView` |

---

### Task 1: Add `disableNavigation` prop to `EntityCard` inline chip

**Files:**
- Modify: `client/src/components/EntityCard.tsx:41-48` (props interface)
- Modify: `client/src/components/EntityCard.tsx:87-95` (destructuring)
- Modify: `client/src/components/EntityCard.tsx:321-410` (inline chip render block)

- [ ] **Step 1: Add prop to the interface**

In `EntityCard.tsx`, update the `EntityCardProps` interface (currently ends around line 48):

```tsx
interface EntityCardProps {
  type: 'character' | 'arc' | 'gamble' | 'guide' | 'organization' | 'chapter' | 'volume' | 'quote'
  id: number
  displayText?: string
  compact?: boolean
  showImage?: boolean
  inline?: boolean
  disableNavigation?: boolean
}
```

- [ ] **Step 2: Destructure the new prop**

In the `EntityCard` function signature (around line 87), add `disableNavigation = false`:

```tsx
const EntityCard: React.FC<EntityCardProps> = ({
  type,
  id,
  displayText,
  compact = false,
  showImage = true,
  inline = false,
  disableNavigation = false,
}) => {
```

- [ ] **Step 3: Replace `<Link>` with conditional element in inline chip branch**

The inline chip branch starts around line 321 (`if (inline) {`). It currently returns a `HoverCard` whose `HoverCard.Target` wraps a `<span>` containing a `<Link href={linkHref}>`.

Replace that inner `<Link href={linkHref} style={{...}} onMouseEnter={...} onMouseLeave={...}>` with a conditional: when `disableNavigation` is false render the existing `<Link>`, when true render a `<span>` with the same styles but `cursor: 'default'` instead of `cursor: 'pointer'`, and without `href`, `onMouseEnter`, or `onMouseLeave`.

The full updated `if (inline)` return block (replace everything from `if (inline) {` to its closing `}`):

```tsx
if (inline) {
  const chipDisplayText = loading
    ? '...'
    : error
      ? (displayText || 'Not found')
      : (displayText || (data ? getDefaultDisplayText(type, data) : `${getEntityTypeLabel(type)} #${id}`))

  const entityChapterNumber: number | undefined = !loading && data
    ? type === 'arc' ? data.startChapter
      : type === 'gamble' ? data.chapterNumber
      : type === 'chapter' ? data.number
      : type === 'volume' ? data.startChapter
      : undefined
    : undefined

  const isHoverSpoilered = shouldHideSpoiler(entityChapterNumber, userProgress, spoilerSettings)

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: rem(7),
    padding: `${rem(3)} ${rem(10)} ${rem(3)} ${rem(4)}`,
    borderRadius: rem(6),
    backgroundColor: '#1a2535',
    border: `1px solid ${rgba(accentColor, 0.3)}`,
    color: accentColor,
    textDecoration: 'none',
    fontSize: rem(13),
    fontWeight: 500,
    lineHeight: 1.4,
    verticalAlign: 'middle',
    cursor: disableNavigation ? 'default' : 'pointer',
    transition: 'filter 120ms ease',
    whiteSpace: 'nowrap',
    maxWidth: rem(240),
  }

  const chipInner = (
    <>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: rem(20),
        height: rem(20),
        borderRadius: rem(3),
        backgroundColor: rgba(accentColor, 0.2),
        color: accentColor,
        flexShrink: 0,
        fontSize: rem(11)
      }}>
        {ICON_MAP_SM[type]}
      </span>
      <Text
        component="span"
        size="sm"
        fw={500}
        lineClamp={1}
        style={{ color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {chipDisplayText}
      </Text>
    </>
  )

  return (
    <HoverCard width={340} shadow="lg" openDelay={200} closeDelay={100} position="top" withinPortal disabled={isHoverSpoilered}>
      <HoverCard.Target>
        <span style={{ display: 'inline' }}>
          {disableNavigation ? (
            <span style={chipStyle}>
              {chipInner}
            </span>
          ) : (
            <Link
              href={linkHref}
              style={chipStyle}
              onMouseEnter={(event) => {
                event.currentTarget.style.filter = 'brightness(1.1)'
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.filter = 'brightness(1)'
              }}
            >
              {chipInner}
            </Link>
          )}
        </span>
      </HoverCard.Target>
      <HoverCard.Dropdown
        style={{
          backgroundColor: theme.colors.dark?.[7] ?? '#1a1a1a',
          border: `1px solid ${rgba(accentColor, 0.3)}`,
          borderRadius: rem(12),
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {renderPopoverContent()}
      </HoverCard.Dropdown>
    </HoverCard>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: build completes with no TypeScript errors related to `EntityCard`.

- [ ] **Step 5: Commit**

```bash
cd client && git add src/components/EntityCard.tsx
git commit -m "feat: add disableNavigation prop to EntityCard inline chip"
```

---

### Task 2: Pass `disableNavigation` from the editor NodeView

**Files:**
- Modify: `client/src/components/RichMarkdownEditor/index.tsx:19-36` (`EntityEmbedNodeView`)

- [ ] **Step 1: Add the prop to EntityCard in NodeView**

In `RichMarkdownEditor/index.tsx`, update `EntityEmbedNodeView` to pass `disableNavigation`:

```tsx
function EntityEmbedNodeView({ node }: NodeViewProps) {
  const { entityType, entityId, displayText } = node.attrs as {
    entityType: EntityType
    entityId: number
    displayText: string | null
  }

  return (
    <NodeViewWrapper as="span" contentEditable={false} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <EntityCard
        type={entityType}
        id={entityId}
        displayText={displayText ?? undefined}
        inline
        disableNavigation
      />
    </NodeViewWrapper>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd client && yarn build 2>&1 | tail -20
```

Expected: clean build, no errors.

- [ ] **Step 3: Commit**

```bash
cd client && git add src/components/RichMarkdownEditor/index.tsx
git commit -m "fix: prevent entity embed chips from navigating while editing"
```

---

### Task 3: Manual verification

- [ ] **Step 1: Start dev server**

```bash
cd client && yarn dev
```

- [ ] **Step 2: Open a page with the rich text editor**

Navigate to any page that uses `RichMarkdownEditor` (e.g. submit a guide at `http://localhost:3000/submit-guide`, or open an existing guide in the admin panel).

- [ ] **Step 3: Insert an entity embed**

Use the toolbar to insert an entity chip (character, arc, etc.).

- [ ] **Step 4: Click the chip — verify no navigation**

Click the chip. The page should stay on the editor page. The chip should appear selected (Tiptap node selection). You should **not** be navigated to the entity's detail page.

- [ ] **Step 5: Hover over the chip — verify HoverCard still works**

Hover over the chip for ~200ms. The HoverCard popup with entity details should appear.

- [ ] **Step 6: Verify navigation still works outside the editor**

Visit any content page that renders entity embeds in read mode (e.g. a guide detail page). Click a chip there — you should be navigated to the entity page as normal.
