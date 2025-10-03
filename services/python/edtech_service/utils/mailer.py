import structlog

logger = structlog.get_logger()

def send_email(*, to: str, subject: str, text: str = "", html: str = "", attachments: list | None = None) -> dict:
    attachments = attachments or []
    logger.info("sending_email_stub", to=to, subject=subject, attachments_count=len(attachments))
    return {"ok": True}
