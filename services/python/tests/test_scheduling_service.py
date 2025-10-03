import asyncio
from edtech_service.services.scheduling import schedule_live_class


def test_schedule_live_class_returns_composite():
    result = asyncio.run(
        schedule_live_class("instr1", "course1", "2025-01-01T10:00:00Z")
    )
    assert result["instructor_id"] == "instr1"
    assert "meeting" in result
    assert result["meeting"]["id"]
