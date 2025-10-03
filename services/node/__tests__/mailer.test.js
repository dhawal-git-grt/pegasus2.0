const { sendEmail } = require('../src/utils/mailer');

describe('mailer stub', () => {
  test('sendEmail resolves ok', async () => {
    const res = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      text: 'Hello',
      attachments: [],
    });
    expect(res).toEqual({ ok: true });
  });
});
