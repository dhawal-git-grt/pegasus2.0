from fastapi.testclient import TestClient
from edtech_service.main import app

client = TestClient(app)


def test_schedule_success():
    res = client.post(
        "/live-classes/schedule",
        json={
            "instructor_id": "i1",
            "course_id": "c1",
            "start_time": "2025-01-01T10:00:00Z",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert "meeting" in body
    assert body["meeting"]["id"]


def test_schedule_missing_fields():
    res = client.post("/live-classes/schedule", json={})
    # Pydantic validation error
    assert res.status_code == 422


def test_schedule_bad_datetime():
    res = client.post(
        "/live-classes/schedule",
        json={
            "instructor_id": "i1",
            "course_id": "c1",
            "start_time": "not-a-date",
        },
    )
    assert res.status_code == 422
