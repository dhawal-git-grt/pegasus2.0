const crypto = require('crypto');

async function createMeeting({ host_id, topic, start_time, duration = 60 }) {
  const seed = `${host_id}|${topic}|${start_time}|${duration}`;
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const meeting_id = parseInt(hash.slice(0, 12), 16).toString().slice(0, 11);
  const startIso = new Date(start_time).toISOString();
  return {
    id: meeting_id,
    topic,
    start_time: startIso,
    duration,
    join_url: `https://zoom.example.com/j/${meeting_id}`,
    host_url: `https://zoom.example.com/host/${meeting_id}`,
  };
}

module.exports = { createMeeting };
