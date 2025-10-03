from ..clients.zoom_mock import create_meeting
from ..utils.ics import create_calendar_invite
from ..utils.mailer import send_email
from ..stores.meetings_store import store as meetings_store


async def schedule_live_class(
    instructor_id: str, course_id: str, start_time: str, participants: list | None = None
) -> dict:
    topic = f"Course {course_id} - Live Class"
    meeting = create_meeting(host_id=instructor_id, topic=topic, start_time=start_time)
    # Persist for webhook handling
    rec = meetings_store.upsert(
        str(meeting["id"]),
        instructor_id=instructor_id,
        course_id=course_id,
        start_time=start_time,
        participants=participants or [],
    )
    # Best-effort calendar invites
    try:
        if participants:
            ics = create_calendar_invite(
                title=topic,
                description=f"Join URL: {meeting['join_url']}",
                start_time=start_time,
                duration_minutes=meeting.get("duration", 60),
                url=meeting.get("join_url"),
                participants=participants,
                uid=rec.uid,
                sequence=rec.sequence,
                status="CONFIRMED",
            )
            subject = f"{topic} at {start_time}"
            for p in participants:
                email = p if isinstance(p, str) else p.get("email")
                if not email:
                    continue
                send_email(
                    to=email,
                    subject=subject,
                    text=f"You are invited to {topic}. Join: {meeting['join_url']}",
                    html=f"<p>You are invited to <b>{topic}</b>.</p><p>Join: <a href='{meeting['join_url']}'>{meeting['join_url']}</a></p>",
                    attachments=[
                        {
                            "filename": ics["filename"],
                            "contentType": ics["contentType"],
                            "content": ics["content"],
                        }
                    ],
                )
    except Exception:
        # Log is configured globally via structlog; swallow errors to not block scheduling
        pass
    return {
        "instructor_id": instructor_id,
        "course_id": course_id,
        "start_time": start_time,
        "meeting": meeting,
    }
