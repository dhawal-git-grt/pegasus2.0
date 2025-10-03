import asyncio
from typing import Any
from fastapi.testclient import TestClient

from edtech_service.main import app
from edtech_service.services.scheduling import schedule_live_class
from edtech_service.stores.meetings_store import store as meetings_store
from edtech_service.stores.idempotency_store import store as idem_store
from edtech_service.config.settings import settings


client = TestClient(app)


def test_schedule_live_class_sends_invites(monkeypatch):
    sent: list[dict[str, Any]] = []

    def fake_send_email(**kwargs):
        sent.append(kwargs)
        return {"ok": True}

    monkeypatch.setattr("edtech_service.services.scheduling.send_email", fake_send_email)

    result = asyncio.run(
        schedule_live_class(
            "instr1",
            "course1",
            "2025-01-01T10:00:00Z",
            participants=["a@example.com", {"email": "b@example.com", "name": "B"}],
        )
    )

    assert result["meeting"]["join_url"].startswith("https://")
    assert len(sent) == 2
    assert "attachments" in sent[0]
    assert "BEGIN:VCALENDAR" in sent[0]["attachments"][0]["content"]


def test_schedule_live_class_invite_error_does_not_fail(monkeypatch):
    def boom(**kwargs):
        raise RuntimeError("mailer down")

    monkeypatch.setattr("edtech_service.services.scheduling.send_email", boom)

    # should not raise; invite errors are swallowed
    result = asyncio.run(
        schedule_live_class(
            "instr1",
            "course1",
            "2025-01-01T10:00:00Z",
            participants=["a@example.com"],
        )
    )
    assert result["meeting"]["id"]


def test_schedule_live_class_zoom_failure_propagates(monkeypatch):
    def fail_create_meeting(**kwargs):
        raise RuntimeError("zoom api error")

    monkeypatch.setattr("edtech_service.services.scheduling.create_meeting", fail_create_meeting)

    try:
        asyncio.run(schedule_live_class("i", "c", "2025-01-01T10:00:00Z"))
        assert False, "expected exception"
    except RuntimeError:
        pass


def test_webhook_meeting_updated_sends_invites(monkeypatch):
    # disable signature verification
    settings.ZOOM_WEBHOOK_DISABLE_VERIFY = True
    idem_store.clear()

    sent: list[dict[str, Any]] = []

    def fake_send_email(**kwargs):
        sent.append(kwargs)
        return {"ok": True}

    monkeypatch.setattr("edtech_service.routers.zoom_webhook.send_email", fake_send_email)

    meeting_id = "99999999999"
    meetings_store.upsert(
        meeting_id,
        instructor_id="i1",
        course_id="c1",
        start_time="2025-01-01T10:00:00Z",
        participants=["a@example.com", {"email": "b@example.com"}],
    )

    payload = {
        "event": "meeting.updated",
        "event_ts": 123456,
        "payload": {
            "object": {
                "id": meeting_id,
                "start_time": "2025-01-01T11:00:00Z",
                "duration": 60,
                "join_url": "https://zoom.example.com/j/99999999999",
            }
        },
    }

    res = client.post("/webhooks/zoom", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert len(sent) == 2
    assert "BEGIN:VCALENDAR" in sent[0]["attachments"][0]["content"]


def test_webhook_duplicate_events(monkeypatch):
    settings.ZOOM_WEBHOOK_DISABLE_VERIFY = True
    idem_store.clear()

    sent: list[dict[str, Any]] = []

    def fake_send_email(**kwargs):
        sent.append(kwargs)
        return {"ok": True}

    monkeypatch.setattr("edtech_service.routers.zoom_webhook.send_email", fake_send_email)

    meeting_id = "88888888888"
    meetings_store.upsert(
        meeting_id,
        instructor_id="i2",
        course_id="c2",
        start_time="2025-01-02T10:00:00Z",
        participants=["x@example.com"],
    )

    payload = {
        "event": "meeting.updated",
        "event_ts": 123,
        "payload": {
            "object": {
                "id": meeting_id,
                "start_time": "2025-01-02T10:30:00Z",
                "duration": 60,
                "join_url": "https://zoom.example.com/j/88888888888",
            }
        },
    }

    r1 = client.post("/webhooks/zoom", json=payload)
    r2 = client.post("/webhooks/zoom", json=payload)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r2.json()["status"] == "duplicate"
    assert len(sent) == 1


def test_webhook_meeting_deleted_sends_cancellation(monkeypatch):
    settings.ZOOM_WEBHOOK_DISABLE_VERIFY = True
    idem_store.clear()

    sent: list[dict[str, Any]] = []

    def fake_send_email(**kwargs):
        sent.append(kwargs)
        return {"ok": True}

    monkeypatch.setattr("edtech_service.routers.zoom_webhook.send_email", fake_send_email)

    meeting_id = "77777777777"
    meetings_store.upsert(
        meeting_id,
        instructor_id="i3",
        course_id="c3",
        start_time="2025-01-03T12:00:00Z",
        participants=["a@c.com", "b@c.com"],
    )

    payload = {
        "event": "meeting.deleted",
        "event_ts": 999,
        "payload": {"object": {"id": meeting_id}},
    }

    res = client.post("/webhooks/zoom", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert len(sent) == 2
    assert "STATUS:CANCELLED" in sent[0]["attachments"][0]["content"]


def test_webhook_invalid_json():
    res = client.post("/webhooks/zoom", data="not-json", headers={"Content-Type": "application/json"})
    assert res.status_code == 400


def test_webhook_invalid_signature(monkeypatch):
    settings.ZOOM_WEBHOOK_DISABLE_VERIFY = False
    settings.ZOOM_WEBHOOK_SECRET_TOKEN = "secret"
    idem_store.clear()

    payload = {
        "event": "meeting.updated",
        "event_ts": 100,
        "payload": {"object": {"id": "1"}},
    }
    # No Authorization header
    res = client.post("/webhooks/zoom", json=payload)
    assert res.status_code == 401
