const request = require('supertest');
const app = require('../src/app');

describe('POST /live-classes/schedule', () => {
  it('succeeds with valid body', async () => {
    const res = await request(app)
      .post('/live-classes/schedule')
      .send({ instructor_id: 'i1', course_id: 'c1', start_time: '2025-01-01T10:00:00Z' });
    expect(res.status).toBe(200);
    expect(res.body.meeting).toBeDefined();
  });

  it('fails with missing fields', async () => {
    const res = await request(app).post('/live-classes/schedule').send({});
    expect(res.status).toBe(400);
  });

  it('fails with bad datetime', async () => {
    const res = await request(app)
      .post('/live-classes/schedule')
      .send({ instructor_id: 'i1', course_id: 'c1', start_time: 'not-a-date' });
    expect(res.status).toBe(400);
  });
});
