const { createEvent } = require('ics');

function isoToStartArray(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) throw new Error('Invalid start_time');
  return [
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
  ];
}

function normalizeAttendees(participants = []) {
  return (participants || [])
    .map((p) => (typeof p === 'string' ? { email: p } : p))
    .filter((p) => p && p.email)
    .map((p) => {
      const a = { email: p.email, rsvp: true };
      if (p.name) a.name = p.name;
      if (p.role) a.role = p.role; // optional
      return a;
    });
}

async function createCalendarInvite({
  title,
  description,
  start_time,
  durationMinutes = 60,
  url,
  organizerName = 'EdTech Platform',
  organizerEmail = 'no-reply@example.com',
  participants,
  uid,
  sequence,
  status = 'CONFIRMED',
}) {
  const attendees = normalizeAttendees(participants);
  const event = {
    start: isoToStartArray(start_time),
    title,
    description,
    duration: { minutes: durationMinutes },
    status,
    organizer: { name: organizerName, email: organizerEmail },
    attendees,
    productId: 'edtech-node-service',
  };
  if (url) event.url = url;
  if (uid) event.uid = uid;
  if (sequence !== undefined) event.sequence = sequence;

  return new Promise((resolve, reject) => {
    createEvent(event, (error, value) => {
      if (error) return reject(error);
      resolve({
        filename: 'invite.ics',
        contentType: 'text/calendar; charset=utf-8',
        content: value,
      });
    });
  });
}

module.exports = { createCalendarInvite, normalizeAttendees, isoToStartArray };
