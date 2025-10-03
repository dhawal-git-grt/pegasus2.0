const request = require('supertest');
const app = require('../src/index');

describe('Schedule API', () => {
  it('should schedule a class and return a 201 status code', async () => {
    const response = await request(app)
      .post('/api/schedule')
      .send({
        instructor_id: 'inst_123',
        course_id: 'course_456',
        start_time: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('meeting_id');
    expect(response.body).toHaveProperty('join_url');
  });

  it('should return a 400 status code for missing data', async () => {
    const response = await request(app)
      .post('/api/schedule')
      .send({});

    expect(response.statusCode).toBe(400);
  });
});
