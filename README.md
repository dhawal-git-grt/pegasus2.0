# EdTech Platform Services

This repository contains two service skeletons for an EdTech platform:

- Node.js service with Express, env-driven config, Pino structured logging, Zoom mock/real API client (Server-to-Server OAuth), ICS invite generation, and Jest tests.
- Python service with FastAPI, env-driven config via Pydantic + python-dotenv, Structlog structured logging, a Zoom mock client, and pytest tests.

Both services include a stub for `schedule_live_class(instructor_id, course_id, start_time)` and unit tests covering config, Zoom mock, scheduling, and HTTP routes.

## Structure

```
services/
  node/
    src/
      app.js
      index.js
      logger.js
      config/
        index.js
      clients/
        zoomMock.js
        zoomApi.js
        zoomClient.js
      routes/
        liveClasses.js
      services/
        schedulingService.js
      utils/
        ics.js
        mailer.js
    __tests__/
    package.json
    jest.config.js
    .env.example

  python/
    edtech_service/
      main.py
      logging_config.py
      config/
        settings.py
      clients/
        zoom_mock.py
      routers/
        live_classes.py
      services/
        scheduling.py
    tests/
    requirements.txt
    .env.example
```

## Quickstart

### Node.js service (services/node)
1. Copy `.env.example` to `.env` and adjust values.
2. Install deps:
   - Windows PowerShell: `npm install`
3. Run tests: `npm test`
4. Start service: `npm start` (listens on `PORT`, default 3000)

API:
- POST `/live-classes/schedule` with JSON `{ "instructor_id", "course_id", "start_time", "participants"?: (string | {email,name})[] }`

Zoom integration:
- Default uses mock: `ZOOM_USE_MOCK=true` (no external calls).
- To call real Zoom API (Server-to-Server OAuth): set `ZOOM_USE_MOCK=false` and provide `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, optional `ZOOM_USER_ID` (defaults to `me`).

On success, the service creates a Zoom meeting and emails an ICS calendar invite to participants using a stub mailer (logs only). Replace `services/node/src/utils/mailer.js` with a real provider when ready.

### Python service (services/python)
1. Copy `.env.example` to `.env` and adjust values.
2. Create venv and install deps:
   - PowerShell:
     - `python -m venv .venv`
     - `.venv\Scripts\Activate.ps1`
     - `pip install -r requirements.txt`
3. Run tests: `pytest`
4. Start service: `uvicorn edtech_service.main:app --reload --port 8000`

API:
- POST `/live-classes/schedule` with JSON `{ "instructor_id", "course_id", "start_time" }`
