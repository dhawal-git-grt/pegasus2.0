from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime
from ..services.scheduling import schedule_live_class

router = APIRouter()


class ScheduleRequest(BaseModel):
    instructor_id: str = Field(..., min_length=1)
    course_id: str = Field(..., min_length=1)
    start_time: datetime


@router.post("/schedule")
async def schedule(req: ScheduleRequest):
    result = await schedule_live_class(
        instructor_id=req.instructor_id,
        course_id=req.course_id,
        start_time=req.start_time.isoformat(),
    )
    return result
