from edtech_service.utils.ics import create_calendar_invite


def test_create_calendar_invite_basic():
    ics = create_calendar_invite(
        title="Test Event",
        description="Join URL: https://example.com/j/123",
        start_time="2025-01-01T10:00:00Z",
        duration_minutes=45,
        url="https://example.com/j/123",
        participants=["alice@example.com", {"email": "bob@example.com", "name": "Bob"}],
        uid="uid-123",
        sequence=1,
        status="CONFIRMED",
    )
    content = ics["content"]
    assert "BEGIN:VCALENDAR" in content
    assert "SUMMARY:Test Event" in content
    assert "URL:https://example.com/j/123" in content
    assert "ATTENDEE:mailto:alice@example.com" in content
    assert "ATTENDEE;CN=Bob:mailto:bob@example.com" in content


def test_create_calendar_invite_cancelled_no_url():
    ics = create_calendar_invite(
        title="Test Event",
        description="Cancelled",
        start_time="2025-01-01T10:00:00Z",
        duration_minutes=30,
        participants=["a@example.com"],
        uid="uid-xyz",
        sequence=2,
        status="CANCELLED",
    )
    content = ics["content"]
    assert "STATUS:CANCELLED" in content
    assert "URL:" not in content
