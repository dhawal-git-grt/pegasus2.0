const axios = require('axios');
const config = require('../config');
const logger = require('../logger');

let tokenCache = { access_token: null, expires_at: 0 };

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.access_token && tokenCache.expires_at - 60 > now) {
    return tokenCache.access_token;
  }
  const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(
    config.ZOOM_ACCOUNT_ID
  )}`;
  const auth = Buffer.from(
    `${config.ZOOM_CLIENT_ID}:${config.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const resp = await axios.post(url, null, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const { access_token, expires_in } = resp.data;
  tokenCache = {
    access_token,
    expires_at: now + (expires_in || 3600),
  };
  return access_token;
}

async function createMeeting({ host_id, topic, start_time, duration = 60, timezone = 'UTC' }) {
  const accessToken = await getAccessToken();
  const userId = config.ZOOM_USER_ID || 'me';

  const payload = {
    topic,
    type: 2, // scheduled
    start_time, // ISO 8601
    duration,
    timezone,
    settings: {
      join_before_host: false,
      waiting_room: true,
      approval_type: 2,
      mute_upon_entry: true,
      participant_video: false,
      host_video: false,
    },
  };

  const resp = await axios.post(
    `https://api.zoom.us/v2/users/${encodeURIComponent(userId)}/meetings`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  const m = resp.data;
  // Normalize to the same shape as zoomMock
  return {
    id: String(m.id),
    topic: m.topic,
    start_time: m.start_time,
    duration: m.duration,
    join_url: m.join_url,
    host_url: m.start_url,
  };
}

module.exports = { createMeeting };
