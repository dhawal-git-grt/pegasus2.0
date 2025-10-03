from __future__ import annotations
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import hashlib


@dataclass
class MeetingRecord:
    instructor_id: str
    course_id: str
    start_time: str
    participants: List[Dict[str, str]] = field(default_factory=list)
    uid: str = ""
    sequence: int = 1


class MeetingsStore:
    def __init__(self) -> None:
        self._by_id: Dict[str, MeetingRecord] = {}

    def _default_uid(self, meeting_id: str) -> str:
        h = hashlib.sha1(meeting_id.encode("utf-8")).hexdigest()
        return f"{h}@edtech.py.local"

    def upsert(
        self,
        meeting_id: str,
        *,
        instructor_id: Optional[str] = None,
        course_id: Optional[str] = None,
        start_time: Optional[str] = None,
        participants: Optional[List[Dict[str, str]]] = None,
    ) -> MeetingRecord:
        rec = self._by_id.get(meeting_id)
        if rec:
            if instructor_id is not None:
                rec.instructor_id = instructor_id
            if course_id is not None:
                rec.course_id = course_id
            if start_time is not None:
                rec.start_time = start_time
            if participants is not None:
                rec.participants = participants
            self._by_id[meeting_id] = rec
            return rec
        rec = MeetingRecord(
            instructor_id=instructor_id or "",
            course_id=course_id or "",
            start_time=start_time or "",
            participants=participants or [],
            uid=self._default_uid(meeting_id),
            sequence=1,
        )
        self._by_id[meeting_id] = rec
        return rec

    def get(self, meeting_id: str) -> Optional[MeetingRecord]:
        return self._by_id.get(meeting_id)

    def bump_sequence(self, meeting_id: str) -> int:
        rec = self._by_id.get(meeting_id)
        if not rec:
            return 0
        rec.sequence = (rec.sequence or 1) + 1
        self._by_id[meeting_id] = rec
        return rec.sequence

    def clear(self) -> None:
        self._by_id.clear()


store = MeetingsStore()
