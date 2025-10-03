jest.mock('../src/utils/mailer', () => ({
  sendEmail: jest.fn().mockResolvedValue({ ok: true }),
}));

const request = require('supertest');
const app = require('../src/app');
const idStore = require('../src/stores/idempotencyStore');
const meetingsStore = require('../src/stores/meetingsStore');
const { sendEmail } = require('../src/utils/mailer');

function buildEvent({ type, meetingId, start_time, join_url, duration = 60, event_ts }) {
  return {
    event: type,
    event_ts,
    payload: {
      object: {
        id: meetingId,
        start_time,
        duration,
        join_url,
      },
    },
  };
}

describe('Zoom webhook', () => {
  beforeEach(() => {
    idStore.clear();
    sendEmail.mockClear();
  });

  test('meeting.updated sends updated invites to participants', async () => {
    const meetingId = '99999999999';
    const orig = '2025-01-01T10:00:00Z';
    const updated = '2025-01-01T11:00:00Z';
    meetingsStore.upsert(meetingId, {
      instructor_id: 'i1',
      course_id: 'c1',
      start_time: orig,
      participants: ['a@example.com', { email: 'b@example.com', name: 'B' }],
    });

    const ev = buildEvent({
      type: 'meeting.updated',
      meetingId,
      start_time: updated,
      join_url: 'https://zoom.example.com/j/99999999999',
      event_ts: Date.now(),
    });

    const res = await request(app)
      .post('/webhooks/zoom')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(ev));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  test('duplicate events are idempotent', async () => {
    const meetingId = '88888888888';
    const ts = Date.now();
    meetingsStore.upsert(meetingId, {
      instructor_id: 'i2',
      course_id: 'c2',
      start_time: '2025-01-02T10:00:00Z',
      participants: ['x@example.com'],
    });

    const ev = buildEvent({
      type: 'meeting.updated',
      meetingId,
      start_time: '2025-01-02T10:30:00Z',
      join_url: 'https://zoom.example.com/j/88888888888',
      event_ts: ts,
    });

    const r1 = await request(app)
      .post('/webhooks/zoom')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(ev));
    const r2 = await request(app)
      .post('/webhooks/zoom')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(ev));

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r2.body.status).toBe('duplicate');
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  test('meeting.deleted sends cancellation invites', async () => {
    const meetingId = '77777777777';
    meetingsStore.upsert(meetingId, {
      instructor_id: 'i3',
      course_id: 'c3',
      start_time: '2025-01-03T12:00:00Z',
      participants: ['a@c.com', 'b@c.com'],
    });

    const ev = buildEvent({
      type: 'meeting.deleted',
      meetingId,
      start_time: '2025-01-03T12:00:00Z',
      join_url: '',
      event_ts: Date.now(),
    });

    const res = await request(app)
      .post('/webhooks/zoom')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(ev));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });
});
