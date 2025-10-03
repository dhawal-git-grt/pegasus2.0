const zoom = require('../src/clients/zoomMock');

test('zoom mock deterministic meeting id', async () => {
  const input = { host_id: 'i1', topic: 'T1', start_time: '2025-01-01T10:00:00Z' };
  const m1 = await zoom.createMeeting(input);
  const m2 = await zoom.createMeeting(input);
  expect(m1.id).toBe(m2.id);
  expect(m1.join_url).toContain(m1.id);
});
