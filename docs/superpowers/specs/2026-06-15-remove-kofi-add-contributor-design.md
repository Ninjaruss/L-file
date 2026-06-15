# Remove Ko-fi / Monetary System — Add Contributor Promotion

**Date:** 2026-06-15
**Status:** Approved

## Summary

Remove all Ko-fi and monetary support infrastructure from the project. Replace Ko-fi-gated features with editor-role gates. Replace the "Support the project" messaging on the About page with a "Become a contributor/editor" section.

Migration SQL will be generated and handed to the user to run on Supabase — it will **not** be executed automatically.

---

## Scope

### Backend — Delete

| Item | Path |
|------|------|
| Donations module (controller, service, module) | `server/src/modules/donations/` |
| Donation entity | `server/src/entities/donation.entity.ts` |
| Ko-fi webhook DTO | `server/src/modules/badges/dto/kofi-webhook.dto.ts` |
| `DonationsModule` import in app module | `server/src/app.module.ts` |
| `KOFI_WEBHOOK_TOKEN` env var | `server/src/config/env.validation.ts` |
| 'donations' Swagger tag | `server/src/main.ts` |
| `processAutomaticBadges` donation badge logic | `server/src/modules/badges/badges.service.ts` |
| Three donation-based badge seeds | `server/src/database/seeds/badge.seeder.ts`, `badges.seed.ts` |

### Backend — Modify

- **`BadgeType` enum** (`server/src/entities/badge.entity.ts`): remove `SUPPORTER`, `ACTIVE_SUPPORTER`, `SPONSOR`; keep only `CUSTOM`
- **`BadgesService`**: remove `processAutomaticBadges` method and any donation imports
- **`BadgesController`**: remove any Ko-fi webhook endpoint if present

### Migration SQL (to run on Supabase — not auto-executed)

```sql
-- Drop the donation table
DROP TABLE IF EXISTS "donation";

-- Remove the three Ko-fi badge rows
DELETE FROM "badge" WHERE "type" IN ('supporter', 'active_supporter', 'sponsor');

-- Remove the old enum values (TypeORM will no longer reference them)
-- Note: if using a PostgreSQL enum type, it may need manual cleanup:
-- ALTER TYPE badge_type_enum RENAME TO badge_type_enum_old;
-- CREATE TYPE badge_type_enum AS ENUM ('custom');
-- ALTER TABLE badge ALTER COLUMN type TYPE badge_type_enum USING type::text::badge_type_enum;
-- DROP TYPE badge_type_enum_old;
```

### Frontend — Delete

| Item | Path |
|------|------|
| `Donation` interface | `client/src/types/index.ts` |
| Ko-fi link in footer | `client/src/components/Footer.tsx` |
| Ko-fi CTA button in supporters list | `client/src/components/SupportersList.tsx` |

### Frontend — Modify

| Component | Change |
|-----------|--------|
| `AboutPageContent.tsx` | Replace "Support the project" Ko-fi hero with "Become a contributor/editor" section; remove Ko-fi link from contact section; update "Supporters" section to remove Ko-fi badge mention |
| `ProfileSettingsPanel.tsx` | Replace Ko-fi gate on custom roles with editor/admin role check; update locked message |
| `ProfilePictureSelector.tsx` | Replace `isSupporter` (badge-based) with `isEditor` (role-based: `editor` or `admin`); update locked state copy |
| `client/src/types/index.ts` | Remove `Donation` interface and `provider: 'kofi' \| 'manual'` |

---

## Feature Gate Replacement

| Feature | Old gate | New gate |
|---------|----------|----------|
| Custom roles | `SUPPORTER` / `ACTIVE_SUPPORTER` / `SPONSOR` badge | `role === 'editor' \| 'admin'` |
| Exclusive profile artwork | `isSupporter` (badge check) | `role === 'editor' \| 'admin'` |

The `ProfileSettingsPanel` receives `hasActiveSupporterBadge: boolean` as a prop today. This prop will be replaced with `isEditor: boolean` (derived from the user's role in the parent component).

---

## About Page Redesign

### Remove
- "Support the project" hero card with Ko-fi button
- Ko-fi link in the contact section
- "Ko-fi supporters automatically receive special badges" copy in the Supporters section

### Add — "Become a contributor" section (replaces the Ko-fi hero)
- Heading: "Contribute to L-File."
- Two sub-sections:
  1. **Code contributions** — "Open a pull request on GitHub. Bug fixes, new features, and improvements are welcome." + GitHub button
  2. **Content contributions** — "Apply for the editor role to add and curate wiki content — characters, arcs, gambles, guides, and more." + contact link (email or Fluxer)

### Supporters section → Contributors section
- Keep the section but rename it "Contributors"
- Remove Ko-fi badge mention; keep acknowledgment of community content contributors

---

## Constraints

- No `yarn db:migrate` or automatic migration execution — SQL is presented to the user
- Do not remove the `custom` badge type or the `BadgesModule` itself
- Do not remove the SupportersList component itself — it may still display custom badge holders
- Keep `ENABLE_SCHEMA_SYNC=true` note: schema sync will reflect entity changes in dev, but the `donation` table and old badge rows need the Supabase SQL above in prod
