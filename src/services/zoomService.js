const logger = require('../utils/logger');

const schedule_live_class = async (instructor_id, course_id, start_time) => {
  logger.info(`Scheduling class for instructor ${instructor_id} and course ${course_id} at ${start_time}`);

  // Mock Zoom API call
  const mockZoomResponse = {
    meeting_id: `zoom-${course_id}-${Date.now()}`,
    join_url: `https://zoom.us/j/1234567890?pwd=somepassword`,
    start_time: start_time,
  };

  return mockZoomResponse;
};

module.exports = {
  schedule_live_class,
};
