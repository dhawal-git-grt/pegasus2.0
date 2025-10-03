const { createCalendarInvite } = require('../src/utils/ics');

describe('ICS generation', () => {
  test('creates an ICS file with expected content', async () => {
    const ics = await createCalendarInvite({
      title: 'Test Event',
      description: 'Join URL: https://example.com/j/123',
      start_time: '2025-01-01T10:00:00Z',
      durationMinutes: 45,
      url: 'https://example.com/j/123',
      participants: [
        'alice@example.com',
        { email: 'bob@example.com', name: 'Bob' },
      ],
    });
    expect(ics.content).toContain('BEGIN:VCALENDAR');
    expect(ics.content).toContain('Test Event');
    expect(ics.content).toContain('https://example.com/j/123');
  });
});
