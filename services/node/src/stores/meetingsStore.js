// Simple in-memory meeting store. Replace with DB in production.
const crypto = require('crypto');

class MeetingsStore {
  constructor() {
    this.byId = new Map(); // meetingId -> { instructor_id, course_id, start_time, participants, uid, sequence }
  }

  _defaultUID(meetingId) {
    const hash = crypto.createHash('sha1').update(String(meetingId)).digest('hex');
    return `${hash}@edtech.local`;
  }

  upsert(meetingId, { instructor_id, course_id, start_time, participants }) {
    const existing = this.byId.get(meetingId);
    if (existing) {
      // Keep existing UID/sequence, update fields
      existing.instructor_id = instructor_id ?? existing.instructor_id;
      existing.course_id = course_id ?? existing.course_id;
      existing.start_time = start_time ?? existing.start_time;
      existing.participants = Array.isArray(participants) ? participants : existing.participants;
      this.byId.set(meetingId, existing);
      return existing;
    }
    const record = {
      instructor_id,
      course_id,
      start_time,
      participants: Array.isArray(participants) ? participants : [],
      uid: this._defaultUID(meetingId),
      sequence: 1,
    };
    this.byId.set(meetingId, record);
    return record;
  }

  get(meetingId) {
    return this.byId.get(meetingId) || null;
  }

  bumpSequence(meetingId) {
    const r = this.byId.get(meetingId);
    if (!r) return null;
    r.sequence = (r.sequence || 1) + 1;
    this.byId.set(meetingId, r);
    return r.sequence;
  }
}

module.exports = new MeetingsStore();
