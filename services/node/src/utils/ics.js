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
    .map((p) => ({
      name: p.name || undefined,
      email: p.email,
      rsvp: true,
      role: 'REQ-PARTICIPANT',
      partstat: 'NEEDS-ACTION',
    }));
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
}) {
  const attendees = normalizeAttendees(participants);
  const event = {
    start: isoToStartArray(start_time),
    title,
    description,
    duration: { minutes: durationMinutes },
    status: 'CONFIRMED',
    organizer: { name: organizerName, email: organizerEmail },
    attendees,
    url,
    productId: 'edtech-node-service',
  };

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
