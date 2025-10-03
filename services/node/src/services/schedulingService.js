const zoom = require('../clients/zoomClient');
const { createCalendarInvite } = require('../utils/ics');
const { sendEmail } = require('../utils/mailer');
const logger = require('../logger');

async function schedule_live_class(instructor_id, course_id, start_time, participants = []) {
  const topic = `Course ${course_id} - Live Class`;
  const startISO = new Date(start_time).toISOString();
  const meeting = await zoom.createMeeting({
    host_id: instructor_id,
    topic,
    start_time: startISO,
  });
  // Best-effort calendar invites to participants
  try {
    if (participants && participants.length) {
      const ics = await createCalendarInvite({
        title: topic,
        description: `Join URL: ${meeting.join_url}`,
        start_time: startISO,
        durationMinutes: meeting.duration || 60,
        url: meeting.join_url,
        participants,
      });
      const subject = `${topic} at ${new Date(start_time).toUTCString()}`;
      await Promise.all(
        participants
          .filter((p) => (typeof p === 'string' ? p : p && p.email))
          .map((p) => (typeof p === 'string' ? { email: p } : p))
          .map((p) =>
            sendEmail({
              to: p.email,
              subject,
              text: `You are invited to ${topic}. Join: ${meeting.join_url}`,
              html: `<p>You are invited to <b>${topic}</b>.</p><p>Join: <a href="${meeting.join_url}">${meeting.join_url}</a></p>`,
              attachments: [
                { filename: ics.filename, contentType: ics.contentType, content: ics.content },
              ],
            })
          )
      );
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send calendar invites');
  }

  return {
    instructor_id,
    course_id,
    start_time: new Date(start_time).toISOString(),
    meeting,
  };
}

module.exports = { schedule_live_class, scheduleLiveClass: schedule_live_class };
