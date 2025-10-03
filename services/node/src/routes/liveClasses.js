const express = require('express');
const { schedule_live_class } = require('../services/schedulingService');

const router = express.Router();

router.post('/schedule', async (req, res) => {
  const { instructor_id, course_id, start_time, participants } = req.body || {};
  if (!instructor_id || !course_id || !start_time) {
    return res.status(400).json({ error: 'instructor_id, course_id, and start_time are required' });
  }
  const dt = new Date(start_time);
  if (isNaN(dt.getTime())) {
    return res.status(400).json({ error: 'start_time must be an ISO 8601 datetime string' });
  }
  if (participants && !Array.isArray(participants)) {
    return res.status(400).json({ error: 'participants must be an array of emails or {email,name}' });
  }
  try {
    const scheduled = await schedule_live_class(instructor_id, course_id, start_time, participants || []);
    return res.json(scheduled);
  } catch (err) {
    req.log.error({ err }, 'Failed to schedule live class');
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
