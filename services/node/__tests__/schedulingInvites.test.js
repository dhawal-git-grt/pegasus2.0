jest.mock('../src/utils/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue({ ok: true }),
}));

jest.mock('../src/clients/zoomClient', () => ({
  createMeeting: jest.fn().mockResolvedValue({
    id: '12345678901',
    join_url: 'https://zoom.example.com/j/12345678901',
    host_url: 'https://zoom.example.com/host/12345678901',
    duration: 60,
    topic: 'Mock Meeting',
    start_time: '2025-01-01T10:00:00Z',
  }),
}));

const { sendEmail } = require('../src/utils/mailer');
const { schedule_live_class } = require('../src/services/schedulingService');

describe('schedule_live_class invites', () => {
  test('sends an email with ICS to each participant', async () => {
    const participants = ['a@example.com', { email: 'b@example.com', name: 'B' }];
    const res = await schedule_live_class('instr1', 'course1', '2025-01-01T10:00:00Z', participants);
    expect(res.meeting.join_url).toBeDefined();
    expect(sendEmail).toHaveBeenCalledTimes(2);
    const call = sendEmail.mock.calls[0][0];
    expect(call.attachments && call.attachments[0]).toBeDefined();
    expect(call.attachments[0].content).toMatch(/BEGIN:VCALENDAR/);
  });
});
