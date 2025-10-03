const { schedule_live_class } = require('../src/services/schedulingService');

test('schedule_live_class returns composite object', async () => {
  const out = await schedule_live_class('instr1', 'course1', '2025-01-01T10:00:00Z');
  expect(out.instructor_id).toBe('instr1');
  expect(out.meeting).toBeDefined();
  expect(out.meeting.id).toBeDefined();
});
