const logger = require('../logger');

async function sendEmail({ to, subject, text, html, attachments = [] }) {
  // Stub mailer: log and resolve. Replace with real provider (e.g., SES, SendGrid) later.
  logger.info({ to, subject, attachmentsCount: attachments.length }, 'Sending email (stub)');
  return { ok: true };
}

module.exports = { sendEmail };
