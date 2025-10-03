from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import Iterable, Union, Dict, Any


def _parse_iso_to_utc(dt_str: str) -> datetime:
    # Support trailing Z
    dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
    return dt.astimezone(timezone.utc)


def _format_dt(dt: datetime) -> str:
    return dt.strftime("%Y%m%dT%H%M%SZ")


def _lines(parts: Iterable[str]) -> str:
    return "\r\n".join(parts) + "\r\n"


def _normalize_participants(participants: Iterable[Union[str, Dict[str, Any]]]) -> Iterable[Dict[str, str]]:
    out = []
    for p in participants or []:
        if isinstance(p, str):
            out.append({"email": p})
        elif isinstance(p, dict) and p.get("email"):
            out.append({"email": p["email"], **({"name": p.get("name")} if p.get("name") else {})})
    return out


def create_calendar_invite(
    *,
    title: str,
    description: str,
    start_time: str,
    duration_minutes: int = 60,
    url: str | None = None,
    organizer_name: str = "EdTech Platform",
    organizer_email: str = "no-reply@example.com",
    participants: Iterable[Union[str, Dict[str, Any]]] | None = None,
    uid: str | None = None,
    sequence: int | None = None,
    status: str = "CONFIRMED",
) -> Dict[str, Any]:
    start_dt = _parse_iso_to_utc(start_time)
    end_dt = start_dt + timedelta(minutes=duration_minutes)
    now = datetime.now(timezone.utc)
    attendees = _normalize_participants(participants or [])

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//EdTech Python Service//",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"DTSTAMP:{_format_dt(now)}",
        f"DTSTART:{_format_dt(start_dt)}",
        f"DTEND:{_format_dt(end_dt)}",
        f"SUMMARY:{title}",
        f"DESCRIPTION:{description}",
        f"STATUS:{status}",
        f"ORGANIZER;CN={organizer_name}:mailto:{organizer_email}",
    ]

    if uid:
        lines.append(f"UID:{uid}")
    if sequence is not None:
        lines.append(f"SEQUENCE:{sequence}")
    if url:
        lines.append(f"URL:{url}")

    for a in attendees:
        if a.get("name"):
            lines.append(f"ATTENDEE;CN={a['name']}:mailto:{a['email']}")
        else:
            lines.append(f"ATTENDEE:mailto:{a['email']}")

    lines += [
        "END:VEVENT",
        "END:VCALENDAR",
    ]

    content = _lines(lines)
    return {
        "filename": "invite.ics",
        "contentType": "text/calendar; charset=utf-8",
        "content": content,
    }
