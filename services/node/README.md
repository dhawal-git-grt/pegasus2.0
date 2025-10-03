# EdTech Node.js Service

Express-based service with env-driven config, Pino structured logging, Zoom mock client, and Jest tests.

## Setup
1. Copy `.env.example` to `.env`.
2. Install deps: `npm install`
3. Run tests: `npm test`
4. Start: `npm start` (default port 3000)

## API
- POST `/live-classes/schedule`
  - Body: `{ "instructor_id": string, "course_id": string, "start_time": ISO8601 string, "participants"?: (string | {email,name})[] }`
  - Response: `{ instructor_id, course_id, start_time, meeting: { id, join_url, host_url, ... } }`

## Zoom integration

By default, the service uses a deterministic Zoom mock for offline development.

- To use the mock, set `ZOOM_USE_MOCK=true` (default).
- To use real Zoom Server-to-Server OAuth:
  - Set `ZOOM_USE_MOCK=false`.
  - Provide `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`.
  - Optionally set `ZOOM_USER_ID` (default `me`).

On successful scheduling, the service generates an ICS calendar invite and sends it to each participant via a stub mailer (logs only). Replace `src/utils/mailer.js` with a real provider when ready.

## Zoom webhooks

- Endpoint: `POST /webhooks/zoom`
- Consumes raw JSON (signature verification ready). Mounts before `express.json()`.
- Events handled:
  - `meeting.updated`: bumps ICS SEQUENCE and sends updated invites.
  - `meeting.deleted` (or `meeting.cancelled`): sends cancellation ICS.
- Idempotency: duplicate events (same `event_ts` + meeting id) are ignored.
  - In-memory key store; replace with Redis/DB in production.
- Logging lifecycle: received → processed → applied (or duplicate/ignored).

Environment variables:
- `ZOOM_WEBHOOK_SECRET_TOKEN`: shared secret for Authorization: Bearer verification (dev stub).
- `ZOOM_WEBHOOK_DISABLE_VERIFY`: set `false` to enforce signature check (default true for dev).
- `ZOOM_WEBHOOK_TOLERANCE_SECONDS`: duplicate window (default 300s) used as TTL for idempotency keys.

Note: Meeting participants are kept in-memory in `src/stores/meetingsStore.js` when scheduled; restart clears them. Swap to a persistent store for production.
