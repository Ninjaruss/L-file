# Fluxer Chat Widget Design

**Date:** 2026-03-28
**Status:** Approved

## Overview

A floating chat widget (bottom-left, all pages except admin) that embeds the `#usogui` channel from the L-File Fluxer server. Public users can read; users with a linked Fluxer account can send messages that appear as their real Fluxer identity. A persistent announcement banner shows the most recent `@everyone`/`@here` message.

---

## Fluxer Credentials

- **Bot token:** stored in `server/.env` as `FLUXER_BOT_TOKEN`
- **Channel ID:** `1479626873328890392` (stored in `server/.env` as `FLUXER_CHAT_CHANNEL_ID`)
- **Bot token header format:** `Authorization: Bot <token>`

---

## Architecture

### Frontend — `FluxerChatWidget`

**Placement:** Added to `client/src/components/LayoutWrapper.tsx` alongside `<Footer />`, excluded from admin via the existing `isAdminPage` check.

**Component location:** `client/src/components/FluxerChatWidget.tsx`

**Widget states:**

| State | Condition | Footer area |
|-------|-----------|-------------|
| Collapsed | Default | 52px bubble, bottom-left |
| Expanded — read-only | Not logged in | Login with Fluxer + Join Server buttons |
| Expanded — no Fluxer link | Logged in, no `fluxerId` | Link Fluxer + Join Server buttons |
| Expanded — full chat | Logged in + `fluxerId` | Text input + send button |
| Expanded — re-link needed | Logged in + `fluxerId` but token expired on send | Inline "Re-link Fluxer" prompt replaces input |

**Layout (expanded):**
- Header: `# usogui · on Fluxer` with a green online dot, close button, and "Join Server ↗" link pointing to `https://fluxer.gg/7ce7lrCc`
- Announcement banner (if present): 📣 icon, "Latest Announcement" label, message text, author, relative timestamp; background `rgba(88,101,242,0.15)` with indigo border
- Message list: scrollable, 220px min-height, avatar (first letter + colour), username, relative timestamp, message text; auto-scrolls to bottom on new messages
- Footer: input + send (Fluxer linked) OR login/link + join-server prompt (otherwise)
- Dimensions: 340px wide × ~460px tall, `position: fixed; bottom: 24px; left: 24px; z-index: 999`

**Polling:**
- On expand: fetch messages immediately, then every 4 seconds
- On collapse: stop polling
- Announcement: fetched once on expand, then every 5 minutes
- Sent messages are added to the local list optimistically before the next poll confirms them

**Avatar colours:** derived from a hash of the Fluxer user ID (deterministic, consistent per user).

**Mantine/Tailwind:** uses Mantine `ActionIcon`, `Transition`, `TextInput`; rest is inline styles consistent with the dark theme (matches `BackToTop.tsx` pattern).

---

### Backend — `fluxer-chat` NestJS Module

**Module location:** `server/src/modules/fluxer-chat/`

**Files:**
- `fluxer-chat.module.ts`
- `fluxer-chat.controller.ts`
- `fluxer-chat.service.ts`

**Endpoints (all under `/api/fluxer-chat`):**

#### `GET /fluxer-chat/messages`
- **Auth:** public (no JWT required)
- **Action:** fetches last 50 messages from `FLUXER_CHAT_CHANNEL_ID` via bot token
- **Side effect:** for each message where `content` contains the literal string `@everyone` or `@here`, if it is newer than the stored announcement (compared by Fluxer snowflake ID timestamp), update the `fluxer_announcement` table
- **Response:** array of `{ id, content, author: { id, username, avatar }, timestamp }`
- **Rate limiting:** response cached in-memory for 2 seconds to prevent bursts from multiple simultaneous users

#### `GET /fluxer-chat/announcement`
- **Auth:** public
- **Action:** reads the single row from `fluxer_announcement` table; if empty, performs a one-time seed scan of the last 100 messages
- **Response:** `{ id, content, author: { username }, timestamp }` or `null`

#### `POST /fluxer-chat/messages`
- **Auth:** JWT required; user must have `fluxerId` and `fluxerAccessToken` set
- **Body:** `{ content: string }` (max 2000 chars)
- **Action:** POSTs to `https://api.fluxer.app/v1/channels/{channelId}/messages` using the user's stored `fluxerAccessToken` with `Authorization: <token>` (no `Bot` prefix)
- **Error handling:** if Fluxer returns 401, clear `fluxerAccessToken` from the user and return 403 with `FLUXER_TOKEN_EXPIRED` code so the frontend can prompt re-linking
- **Response:** the created message object echoed back

---

### Database — `FluxerAnnouncement` Entity

**Table:** `fluxer_announcement`
**Single-row table** (enforced by a unique constant `id = 1`):

```
id              integer  PK, always 1
messageId       varchar  Fluxer message snowflake ID
content         text
authorUsername  varchar
authorId        varchar
timestamp       timestamptz
updatedAt       timestamptz (auto)
```

**Migration:** generated via `yarn db:generate` — creates the `fluxer_announcement` table.

---

### User Entity — `fluxerAccessToken`

Add one column to the existing `user` entity:

```
fluxerAccessToken  varchar  nullable  (stored server-side only, never returned in API responses)
```

**Where it's set:** `FluxerStrategy.validate()` receives the `accessToken` as its first argument. Pass it through to `AuthService.validateFluxerUser()` and `AuthService.linkFluxerToUser()` so it is written to the column.

**Security:** the column is excluded from all user-facing DTOs and `getCurrentUser()` responses. It is used exclusively within `FluxerChatService.sendMessage()`.

**Migration:** generated via `yarn db:generate` — adds `fluxerAccessToken` to `user`.

---

### Environment Variables

Add to `server/.env` and `server/.env.example`:

```
FLUXER_BOT_TOKEN=<bot token from Fluxer developer portal>
FLUXER_CHAT_CHANNEL_ID=1479626873328890392
```

---

## Data Flow

```
User opens widget
  → Frontend GETs /fluxer-chat/announcement  → DB read (or seed scan)
  → Frontend GETs /fluxer-chat/messages      → Bot token → Fluxer API
      → service checks for @everyone/@here → updates fluxer_announcement if newer
  → Repeats every 4s (messages) / 5min (announcement)

User sends message (Fluxer linked)
  → Frontend POSTs /fluxer-chat/messages { content }
  → Service fetches user.fluxerAccessToken from DB
  → POSTs to Fluxer API as user
  → Returns message; frontend adds optimistically to list
```

---

## Error States

| Scenario | Behaviour |
|----------|-----------|
| Fluxer API unreachable | Show last cached messages; silent retry next poll |
| `fluxerAccessToken` expired (401 from Fluxer on send) | Backend clears token, returns 403 `FLUXER_TOKEN_EXPIRED`; frontend shows "Re-link Fluxer" prompt |
| User not in server / no send permission | Fluxer returns 403; surface as "You need to join the server to chat" |
| Empty announcement table + seed scan finds nothing | Announcement banner hidden |

---

## Out of Scope

- WebSocket real-time relay (can be added later as an enhancement to the polling approach)
- Message reactions, embeds, attachments
- Fluxer OAuth token refresh (access tokens are valid for the session; re-linking re-issues a fresh token)
