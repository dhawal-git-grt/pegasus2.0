import hashlib
from datetime import datetime, timezone


def create_meeting(host_id: str, topic: str, start_time: str, duration: int = 60) -> dict:
    seed = f"{host_id}|{topic}|{start_time}|{duration}"
    h = hashlib.md5(seed.encode("utf-8")).hexdigest()
    meeting_id = str(int(h[:12], 16))[:11]

    dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
    start_iso = dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    return {
        "id": meeting_id,
        "topic": topic,
        "start_time": start_iso,
        "duration": duration,
        "join_url": f"https://zoom.example.com/j/{meeting_id}",
        "host_url": f"https://zoom.example.com/host/{meeting_id}",
    }
