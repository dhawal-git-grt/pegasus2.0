const zoom = require('../clients/zoomMock');

async function schedule_live_class(instructor_id, course_id, start_time) {
  const topic = `Course ${course_id} - Live Class`;
  const meeting = await zoom.createMeeting({
    host_id: instructor_id,
    topic,
    start_time,
  });
  return {
    instructor_id,
    course_id,
    start_time: new Date(start_time).toISOString(),
    meeting,
  };
}

module.exports = { schedule_live_class, scheduleLiveClass: schedule_live_class };
