from __future__ import annotations
from fastapi import APIRouter, Request, Response
from typing import Any, Dict
import structlog

from ..config.settings import settings
from ..stores.idempotency_store import store as idem_store
from ..stores.meetings_store import store as meetings_store
from ..utils.ics import create_calendar_invite
from ..utils.mailer import send_email

logger = structlog.get_logger()
router = APIRouter()


def _verify(request: Request) -> bool:
    if settings.ZOOM_WEBHOOK_DISABLE_VERIFY:
        return True
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    return bool(token and token == settings.ZOOM_WEBHOOK_SECRET_TOKEN)


@router.post("/webhooks/zoom")
async def zoom_webhook(request: Request) -> Response:
    try:
        event: Dict[str, Any] = await request.json()
    except Exception:
        logger.error("zoom_webhook_invalid_json")
        return Response(status_code=400, content="invalid json")

    if not _verify(request):
        logger.warning("zoom_webhook_invalid_signature")
        return Response(status_code=401, content="invalid signature")

    event_type = str(event.get("event") or "")
    payload = event.get("payload") or {}
    obj = payload.get("object") or {}
    meeting_id = str(obj.get("id") or "")
    event_ts = str(event.get("event_ts") or "")
    event_id = f"{event_ts}:{meeting_id or event_type}"

    ttl = int(settings.ZOOM_WEBHOOK_TOLERANCE_SECONDS or 300)
    if not idem_store.check_and_mark(event_id, ttl_seconds=ttl):
        logger.info("zoom_webhook_duplicate", event_id=event_id)
        return Response(status_code=200, content='{"status":"duplicate"}', media_type="application/json")

    logger.info("zoom_webhook_received", event_type=event_type, event_id=event_id, meeting_id=meeting_id)

    try:
        if not meeting_id:
            logger.warning("zoom_webhook_missing_meeting_id", event_payload=event)
            return Response(status_code=200, content='{"status":"ignored"}', media_type="application/json")

        if event_type == "meeting.updated":
            rec = meetings_store.get(meeting_id)
            if not rec:
                logger.warning("zoom_webhook_update_unknown_meeting", meeting_id=meeting_id)
            else:
                new_start = obj.get("start_time") or rec.start_time
                rec.start_time = new_start
                seq = meetings_store.bump_sequence(meeting_id)
                if rec.participants:
                    ics = create_calendar_invite(
                        title=f"Course {rec.course_id} - Live Class",
                        description=f"Updated meeting. Join URL: {obj.get('join_url','')}",
                        start_time=new_start,
                        duration_minutes=obj.get("duration", 60),
                        url=obj.get("join_url"),
                        participants=rec.participants,
                        uid=rec.uid,
                        sequence=seq,
                        status="CONFIRMED",
                    )
                    subject = f"[Updated] Course {rec.course_id} - Live Class at {new_start}"
                    for p in rec.participants:
                        email = p if isinstance(p, str) else p.get("email")
                        if not email:
                            continue
                        send_email(
                            to=email,
                            subject=subject,
                            text=f"Updated meeting. Join: {obj.get('join_url','')}",
                            html=f"<p>Updated meeting.</p><p>Join: <a href='{obj.get('join_url','#')}'>{obj.get('join_url','link')}</a></p>",
                            attachments=[
                                {
                                    "filename": ics["filename"],
                                    "contentType": ics["contentType"],
                                    "content": ics["content"],
                                }
                            ],
                        )
                logger.info("zoom_webhook_applied_update", meeting_id=meeting_id)
        elif event_type in ("meeting.deleted", "meeting.cancelled"):
            rec = meetings_store.get(meeting_id)
            if rec and rec.participants:
                seq = meetings_store.bump_sequence(meeting_id)
                ics = create_calendar_invite(
                    title=f"Course {rec.course_id} - Live Class",
                    description="Meeting cancelled.",
                    start_time=rec.start_time,
                    duration_minutes=60,
                    participants=rec.participants,
                    uid=rec.uid,
                    sequence=seq,
                    status="CANCELLED",
                )
                subject = f"[Cancelled] Course {rec.course_id} - Live Class"
                for p in rec.participants:
                    email = p if isinstance(p, str) else p.get("email")
                    if not email:
                        continue
                    send_email(
                        to=email,
                        subject=subject,
                        text="The meeting has been cancelled.",
                        html="<p>The meeting has been cancelled.</p>",
                        attachments=[
                            {
                                "filename": ics["filename"],
                                "contentType": ics["contentType"],
                                "content": ics["content"],
                            }
                        ],
                    )
                logger.info("zoom_webhook_applied_cancellation", meeting_id=meeting_id)
        else:
            logger.info("zoom_webhook_ignored_type", event_type=event_type)

        logger.info("zoom_webhook_processed", event_id=event_id)
        return Response(status_code=200, content='{"status":"ok"}', media_type="application/json")
    except Exception:
        logger.exception("zoom_webhook_processing_error")
        return Response(status_code=200, content='{"status":"error"}', media_type="application/json")
