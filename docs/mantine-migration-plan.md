# MUI → Mantine v8.3 Migration Playbook

## 1. Current MUI Footprint
- 70+ React modules import from `@mui/material`, `@mui/icons-material`, or `@mui/material/styles` (see `rg "@mui" client/src`)
- Shared provider stack renders both Mantine and MUI side-by-side; Mantine already supplies theme tokens (`client/src/lib/mantine-theme.ts`) while MUI drives layout/inputs on legacy flows, notably admin (`client/src/components/admin/**`) and polymorphic media components.
- React Admin relies on MUI styling at runtime (`client/src/components/admin/AdminLayout.tsx:1-123`), so admin migration requires either Mantine-compatible RA v5 theming or a staged carve-out.

## 2. Visual + Interaction Specification

### 2.1 Theme Tokens
- **Palette**: core brand hex values defined in `client/src/lib/theme.ts:37-83` (`usogui.red` `#e11d48`, `purple` `#7c3aed`, `black` `#0a0a0a`, entity accent spectrum for gamble/character/arc/event/guide/media/quote).
- **Typography**: serif display face (`"OPTI Goudy Text"`) for headings, sans body copy (`"Noto Sans"`) with 400 weight baseline (`client/src/lib/theme.ts:84-123`). Mantine override mirrors this (`client/src/lib/mantine-theme.ts:34-72`).
- **Borders & Shadows**: Cards/Paper/Menu share blur glassmorphism, `border: 1px solid rgba(225, 29, 72, 0.2-0.3)` and hover elevation (`client/src/lib/theme.ts:125-194`). Mantine theme reproduces the same tokens via component styles (`client/src/lib/mantine-theme.ts:86-156`).
- **Radiuses**: Buttons use 6px (`client/src/lib/theme.ts:145-165`), cards 8px; Mantine `defaultRadius: 'md'` already maps to ~8px, so keep explicit values where needed.
- **Spacing**: MUI `spacing(1)` defaults to 8px; ad-hoc `sx` blocks typically use 1–3 multiples (e.g., `py: 4` ⇒ 32px in `client/src/components/MediaGallery.tsx:310-348`). Capture these exact pixel values during component migration.

### 2.2 Layout Patterns
- **Glass panels**: `Paper`, `Dialog`, `Menu`, `Card` share semi-opaque black BG with blur and accent borders.
- **Chip/Badge styling**: status labels rely on filled backgrounds with uppercase captions (`client/src/components/admin/AdminLayout.tsx:37-111`).
- **Floating overlays**: `FloatingProgressIndicator` uses fixed bottom-right FAB (`24px` offset) and `Dialog` with `Slide` transition (`client/src/components/FloatingProgressIndicator.tsx:175-286`).
- **Media grids**: `MediaGallery` leverages `Grid` for responsive tiling, `Dialog` lightbox with zoom state, and filter form controls (`client/src/components/MediaGallery.tsx:63-450`).

### 2.3 Interaction & Responsive Behavior
- **Hover outlines**: Menus/cards use inset box-shadows to highlight selection (`rgba(225, 29, 72, 0.35)`), seen in Mantine nav dropdown (`client/src/components/DropdownButton.tsx:42-118`).
- **Keyboard support**: Floating progress dialog handles arrow keys, Enter/Escape for commit/cancel (`client/src/components/FloatingProgressIndicator.tsx:135-148`). Maintain identical handlers when swapping to Mantine components.
- **Responsive breakpoints**: `useMediaQuery(theme.breakpoints.down('sm'))` toggles compact layout in media gallery (`client/src/components/MediaGallery.tsx:75-207`). Translate to Mantine `useMantineTheme` + `em` helpers or `visibleFrom` props.
- **Transitions**: MUI `Slide` and `Fade` used for modals and image transitions. Mantine provides `Transition`, `Modal` with preset animations; replicate durations (`Slide` default 225ms) for parity.
- **Tooltips/Menu focus**: consistent focus outlines and `aria` attributes (e.g., `<Tooltip title>` wrappers across FAB, nav accounts). Ensure Mantine `Tooltip` uses `openDelay/closeDelay` to mimic defaults when necessary.

## 3. Component & API Mapping

| Usage | MUI Source | Mantine Target | Notes |
| --- | --- | --- | --- |
| Layout container | `Box`, `Container`, `Grid`, `Stack` | `Box`, `Container`, `Grid`, `Flex`, `Stack` | Replace `sx` with `style`/`styles`/`classNames`. For fractional spacing convert 8px baseline to `rem` via `rem()` helper. |
| Surface | `Card`, `Paper` | `Card`, `Paper`, `BackgroundImage` | Apply blur/border override via theme or component `classNames`. |
| Typography | `Typography` variants | `Text`, `Title`, `Heading`, `Anchor` | Map `variant` to specific Mantine components and `size/ff/weight`. Preserve semantic tags via `component` prop. |
| Buttons | `Button`, `IconButton`, `Fab` | `Button`, `ActionIcon`, `FloatingIndicator` (custom) | Mantine `ActionIcon` + `size="xl"` replicates FAB; add `radius="xl"`, `shadow` to match. |
| Inputs | `TextField`, `Select`, `MenuItem`, `FormControl`, `InputLabel`, `Checkbox`, `Radio`, `Slider` | `TextInput`, `Select`, `NativeSelect`, `Checkbox`, `Radio`, `Slider` | Build composite wrappers for label+helper text to match MUI field spacing; leverage `Input.Wrapper`. |
| Navigation | `Menu`, `MenuItem`, `MenuList`, `Popover` | `Menu`, `Popover`, `HoverCard` | Mantine already used in dropdown; apply `styles.dropdown/item`. |
| Feedback | `Alert`, `CircularProgress`, `LinearProgress`, `Snackbar` | `Alert`, `Loader`, `Progress`, `Notification` | Use `@mantine/notifications` for Snackbars. |
| Overlays | `Dialog`, `Drawer`, `Modal`, `Backdrop` | `Modal`, `Drawer`, `Overlay`, `Dialog` (Mantine) | Manage controlled `opened` state; replicate `PaperProps.sx`. |
| Data display | `Chip`, `Badge`, `Avatar`, `Tooltip` | `Badge`, `Chip`, `Avatar`, `Tooltip` | Mantine `Badge` w/ `variant="filled"`, `radius="sm"` replicates chips. |
| Tables | `Table`, `TableRow`, `TableCell` | `Table`, `ScrollArea`, `DataTable` (community) | Compose `Table` with `ScrollArea`. |
| Theme utilities | `ThemeProvider`, `CssBaseline`, `useTheme`, `useMediaQuery` | `MantineProvider`, `Global`, `useMantineTheme`, `useMantineColorScheme`, `em` | Centralize tokens in Mantine theme, expose helper hook for entity colors. |
| Icons | `@mui/icons-material` | `lucide-react`, `tabler-icons-react`, custom SVG | Replace references; already partial swap to `lucide-react`. |
| Transitions | `Slide`, `Fade`, `Collapse`, `Grow` | `Transition`, `Collapse`, `Accordion`, `Transition` component | Mantine `Transition` replicates `Slide` w/ `transition="slide-up"`, `duration={225}`. |
| Styles API | `sx`, `makeStyles`, `styled` | Mantine `styles`, `classNames`, `createStyles`, CSS modules, Tailwind classes (existing) | Introduce util to convert repeated `sx` objects to Mantine `styles`. |

Special cases:
- React Admin wrappers still need MUI until RA v5 Mantine skin or custom layout is ready. Consider isolating RA into separate bundle or gradually replace with Mantine + RA headless components.
- `EmotionRegistry` currently scopes MUI styles; once MUI eliminated, remove registry and emotion dependencies.
- MUI `Snackbar` not found in scan; if discovered later, map to Notifications.

## 4. Migration Sequence

1. **Theme Convergence**
   - Expand Mantine theme (`client/src/lib/mantine-theme.ts`) to expose spacing + transition tokens mirroring MUI defaults (8px spacing, durations). Add helper `getEntityAccent(type)` to centralize color usage.
   - Introduce Mantine `Global` styles to replicate `CssBaseline` (set body bg `#0a0a0a`, typography defaults). Remove `CssBaseline` once parity confirmed.
   - **Status**: Mantine theme now provides spacing/radius/breakpoint tokens, global styles, and `getEntityAccent`; next up is replacing public `ThemeProvider` usage and removing `CssBaseline`.
   - **Pending**: Components still consuming MUI's `useTheme` (`rg "from '@mui/material/styles'" client/src`) include media galleries, entity embeds, and multiple app pages—plan targeted rewrites before detaching the MUI provider.
   - ✅ Utility `rgba`/`darken` helpers from Mantine replace any `theme.fn` access to avoid undefined theme methods during migration.

2. **Provider Refactor**
   - Update `ClientProviders` to render a single Mantine provider tree. For admin, either wrap RA in Mantine or lazy-load MUI provider until RA migration completes. Start by moving `FloatingProgressIndicator` off MUI so public pages no longer require `ThemeProvider`.

3. **Shared Atom Migration**
   - Replace `Avatar`, `Chip`, `Badge`, `Tooltip`, `IconButton` usage across shared components (`client/src/components/**`) with Mantine equivalents. Create compatibility wrappers if needed (e.g., `MantineTooltip` replicating `Tooltip` props) to minimize churn.
  - Refactor `FloatingProgressIndicator` to Mantine `ActionIcon`, `Modal`, `NumberInput`, `Progress`. Ensure keyboard interactions remain identical.
     - ✅ Completed – component now relies solely on Mantine primitives (`FloatingProgressIndicator.tsx`) while preserving gradient styling, keyboard controls, and success feedback.
     - ✅ `UserProfileImage` / `AuthorProfileImage` now use Mantine `Avatar`, maintaining fallback colors and error handling.
     - ✅ `CustomRoleDisplay`, `BadgeDisplay`, and `GambleChip` switched to Mantine `Badge`/`Tooltip` styling while keeping gradients, hover states, and role hierarchy.
     - ✅ `EntityCard` rebuilt on Mantine (`Card`, `Badge`, `Avatar`) with centralized accent colors from the theme.

4. **Compound Components & Pages**
   - Media experiences (`MediaThumbnail`, `MediaGallery`, `EntityEmbedHelper*`) migrate next. Focus on grid layouts, dialogs, and filtering controls. Use Mantine `SimpleGrid`, `Modal`, `Select`, `SegmentedControl`.
     - ✅ `MediaGallery` now fully Mantine-based (cards, modal, filters, responsive grid) with preserved gradients and embed behavior.
     - ✅ `MediaThumbnail` replaced with Mantine (spoiler overlay, cycling controls, loading/error states) while keeping inline/compact sizing logic.
   - Public pages (`client/src/app/**`) transition section-by-section, leveraging new shared atoms.
     - ✅ `app/about/page.tsx` now uses Mantine layout primitives (Container, Grid, Card, Button, List) eliminating MUI usage.
     - ✅ Guides listing (`app/guides/page.tsx`, `GuidesPageContent.tsx`) rebuilt with Mantine inputs, cards, pagination, and alerts.
     - ✅ Gambles listing (`app/gambles/page.tsx`, `GamblesPageContent.tsx`) migrated to Mantine components and simplified filters.
   - Admin suite: evaluate feasibility of swapping React Admin theme to Mantine wrappers or reimplementing custom dashboards. If RA dependency is immovable short-term, isolate MUI to admin route bundle with CSS namespace separation.

5. **Cleanup**
   - Remove residual `@mui` imports (automated `rg` to confirm). Delete `client/src/lib/theme.ts`, Emotion registry, and MUI-specific typings. Update lint/tests to forbid MUI dependencies.

## 5. Verification & Quality Gates

- **Visual Regression**: Capture baseline screenshots (Storybook/Playwright) for key flows—navigation, media gallery, entity cards, admin dashboards. After migration, run diff at breakpoints (`xs`, `sm`, `md`, `lg`).
- **Interaction Tests**: Automated RTL tests for `FloatingProgressIndicator` modal keyboard behavior and media gallery filtering. Manual checks for hover/focus states (use browser devtools ruler to confirm 24px/32px paddings).
- **Responsive Audit**: Validate `visibleFrom`/`hiddenFrom` replacements and grid collapse at `sm<640px` and `md≥768px` to match current `useMediaQuery` logic.
- **Accessibility**: Use axe-core and manual keyboard traversal to ensure `aria-*` attributes preserved (especially in modals/tooltips). Confirm focus trap in Mantine `Modal` replicates custom behavior.
- **Performance**: Monitor bundle diff—Mantine-only build should drop MUI chunk; track route-level Web Vitals after removing Emotion + MUI.
- **Acceptance Criteria**: No `@mui/*` imports in `client` except temporary admin carve-out; pixel parity verified; unit tests updated/passing; documentation refreshed to describe Mantine patterns.

## 6. Deliverables & Tracking
- Maintain a migration checklist issue in project management tool referencing this playbook.
- Create Storybook stories (or Mantine equivalent) for migrated components to enable quick visual QA.
- Schedule phased deployments with feature flags where risk of regression is high (media gallery, progress modal).
