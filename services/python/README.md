# EdTech Python Service

FastAPI-based service with env-driven config, structlog structured logging, Zoom mock client, and pytest tests.

## Setup
1. Copy `.env.example` to `.env`.
2. Create venv and install deps:
   - `python -m venv .venv`
   - `.venv\\Scripts\\Activate.ps1`
   - `pip install -r requirements.txt`
3. Run tests: `pytest`
4. Start: `uvicorn edtech_service.main:app --reload --port 8000`

## API
- POST `/live-classes/schedule`
  - Body: `{ "instructor_id": string, "course_id": string, "start_time": ISO8601 string }`
  - Response: `{ instructor_id, course_id, start_time, meeting: { id, join_url, host_url, ... } }`
