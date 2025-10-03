# EdTech Node.js Service

Express-based service with env-driven config, Pino structured logging, Zoom mock client, and Jest tests.

## Setup
1. Copy `.env.example` to `.env`.
2. Install deps: `npm install`
3. Run tests: `npm test`
4. Start: `npm start` (default port 3000)

## API
- POST `/live-classes/schedule`
  - Body: `{ "instructor_id": string, "course_id": string, "start_time": ISO8601 string }`
  - Response: `{ instructor_id, course_id, start_time, meeting: { id, join_url, host_url, ... } }`
