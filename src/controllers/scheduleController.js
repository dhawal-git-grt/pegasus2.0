const zoomService = require('../services/zoomService');
const logger = require('../utils/logger');

const scheduleClass = async (req, res) => {
  try {
    const { instructor_id, course_id, start_time } = req.body;
    if (!instructor_id || !course_id || !start_time) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await zoomService.schedule_live_class(instructor_id, course_id, start_time);
    res.status(201).json(result);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  scheduleClass,
};
