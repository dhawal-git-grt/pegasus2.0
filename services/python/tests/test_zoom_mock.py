from edtech_service.clients.zoom_mock import create_meeting


def test_zoom_mock_deterministic():
    payload = {"host_id": "i1", "topic": "T1", "start_time": "2025-01-01T10:00:00Z"}
    m1 = create_meeting(**payload)
    m2 = create_meeting(**payload)
    assert m1["id"] == m2["id"]
    assert m1["join_url"].endswith(m1["id"])
