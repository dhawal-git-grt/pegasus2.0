from ..clients.zoom_mock import create_meeting


async def schedule_live_class(instructor_id: str, course_id: str, start_time: str) -> dict:
    topic = f"Course {course_id} - Live Class"
    meeting = create_meeting(host_id=instructor_id, topic=topic, start_time=start_time)
    return {
        "instructor_id": instructor_id,
        "course_id": course_id,
        "start_time": start_time,
        "meeting": meeting,
    }
