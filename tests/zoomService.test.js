const zoomService = require('../src/services/zoomService');

describe('Zoom Service', () => {
  it('should schedule a live class and return mock data', async () => {
    const instructor_id = 'inst_123';
    const course_id = 'course_456';
    const start_time = new Date().toISOString();

    const result = await zoomService.schedule_live_class(instructor_id, course_id, start_time);

    expect(result).toHaveProperty('meeting_id');
    expect(result).toHaveProperty('join_url');
    expect(result.start_time).toBe(start_time);
  });
});
