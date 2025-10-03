const express = require('express');
const config = require('../../config');
const logger = require('../../logger');
const idempotencyStore = require('../../stores/idempotencyStore');
const meetingsStore = require('../../stores/meetingsStore');
const { createCalendarInvite } = require('../../utils/ics');
const { sendEmail } = require('../../utils/mailer');
const { retry } = require('../../utils/retry');

const router = express.Router();

// Use raw body to allow signature verification
router.use(express.raw({ type: 'application/json' }));

function verifyZoomSignature(req) {
  if (config.ZOOM_WEBHOOK_DISABLE_VERIFY) return true;
  const auth = req.headers['authorization'] || '';
  const token = String(auth).replace(/^Bearer\s+/i, '');
  return token && token === config.ZOOM_WEBHOOK_SECRET_TOKEN;
}

router.post('/', async (req, res) => {
  let event;
  try {
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''));
    event = JSON.parse(raw.toString('utf8'));
  } catch (err) {
    req.log.error({ err }, 'zoom webhook: invalid json');
    return res.status(400).send('invalid json');
  }

  if (!verifyZoomSignature(req)) {
    req.log.warn({ headers: req.headers }, 'zoom webhook: invalid signature');
    return res.status(401).send('invalid signature');
  }

  const meetingId = String(event?.payload?.object?.id || '');
  const eventTs = String(event?.event_ts || '');
  const eventId = `${eventTs}:${meetingId || event?.event}`;

  // Idempotency
  const ttlMs = (config.ZOOM_WEBHOOK_TOLERANCE_SECONDS || 300) * 1000;
  if (!idempotencyStore.checkAndMark(eventId, ttlMs)) {
    req.log.info({ eventId }, 'zoom webhook: duplicate - ignored');
    return res.status(200).json({ status: 'duplicate' });
  }

  req.log.info({ event: event.event, eventId, meetingId }, 'zoom webhook: received');

  try {
    const type = event.event;
    const obj = event.payload?.object || {};

    if (!meetingId) {
      req.log.warn({ event }, 'zoom webhook: missing meeting id');
      return res.status(200).json({ status: 'ignored' });
    }

    if (type === 'meeting.updated') {
      const record = meetingsStore.get(meetingId);
      if (!record) {
        req.log.warn({ meetingId }, 'zoom webhook: update for unknown meeting');
      } else {
        const newStart = obj.start_time || record.start_time;
        record.start_time = newStart;
        const seq = meetingsStore.bumpSequence(meetingId);
        if (record.participants && record.participants.length) {
          const ics = await createCalendarInvite({
            title: `Course ${record.course_id} - Live Class`,
            description: `Updated meeting. Join URL: ${obj.join_url || ''}`,
            start_time: newStart,
            durationMinutes: obj.duration || 60,
            url: obj.join_url || '',
            participants: record.participants,
            uid: record.uid,
            sequence: seq,
            status: 'CONFIRMED',
          });
          const subject = `[Updated] Course ${record.course_id} - Live Class at ${new Date(newStart).toUTCString()}`;
          await Promise.all(
            record.participants.map((p) => {
              const email = typeof p === 'string' ? p : p?.email;
              if (!email) return Promise.resolve();
              return retry(() =>
                sendEmail({
                  to: email,
                  subject,
                  text: `Updated meeting. Join: ${obj.join_url || ''}`,
                  html: `<p>Updated meeting.</p><p>Join: <a href="${obj.join_url || '#'}">${obj.join_url || 'link'}</a></p>`,
                  attachments: [{ filename: ics.filename, contentType: ics.contentType, content: ics.content }],
                })
              );
            })
          );
        }
        req.log.info({ meetingId }, 'zoom webhook: applied update');
      }
    } else if (type === 'meeting.deleted' || type === 'meeting.cancelled') {
      const record = meetingsStore.get(meetingId);
      if (record && record.participants && record.participants.length) {
        const seq = meetingsStore.bumpSequence(meetingId);
        const ics = await createCalendarInvite({
          title: `Course ${record.course_id} - Live Class`,
          description: `Meeting cancelled.`,
          start_time: record.start_time,
          durationMinutes: 60,
          url: '',
          participants: record.participants,
          uid: record.uid,
          sequence: seq,
          status: 'CANCELLED',
        });
        const subject = `[Cancelled] Course ${record.course_id} - Live Class`;
        await Promise.all(
          record.participants.map((p) => {
            const email = typeof p === 'string' ? p : p?.email;
            if (!email) return Promise.resolve();
            return retry(() =>
              sendEmail({
                to: email,
                subject,
                text: `The meeting has been cancelled.`,
                html: `<p>The meeting has been cancelled.</p>`,
                attachments: [{ filename: ics.filename, contentType: ics.contentType, content: ics.content }],
              })
            );
          })
        );
        req.log.info({ meetingId }, 'zoom webhook: applied cancellation');
      } else {
        req.log.warn({ meetingId }, 'zoom webhook: cancellation for unknown meeting');
      }
    } else {
      req.log.info({ type }, 'zoom webhook: ignored event type');
    }

    req.log.info({ eventId }, 'zoom webhook: processed');
    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    req.log.error({ err }, 'zoom webhook: processing error');
    return res.status(200).json({ status: 'error' });
  }
});

module.exports = router;
