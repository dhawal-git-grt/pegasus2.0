// Simple in-memory idempotency store with TTL and max size
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const MAX_SIZE = 2000;

class IdempotencyStore {
  constructor() {
    this.map = new Map(); // key -> expiresAt
  }

  cleanup(now = Date.now()) {
    for (const [k, exp] of this.map.entries()) {
      if (exp <= now) this.map.delete(k);
    }
    // Trim oldest if over capacity
    while (this.map.size > MAX_SIZE) {
      const firstKey = this.map.keys().next().value;
      this.map.delete(firstKey);
    }
  }

  has(key, now = Date.now()) {
    const exp = this.map.get(key);
    if (!exp) return false;
    if (exp <= now) {
      this.map.delete(key);
      return false;
    }
    return true;
  }

  mark(key, ttlMs = DEFAULT_TTL_MS, now = Date.now()) {
    const expiresAt = now + ttlMs;
    this.map.set(key, expiresAt);
    this.cleanup(now);
  }

  checkAndMark(key, ttlMs = DEFAULT_TTL_MS, now = Date.now()) {
    if (this.has(key, now)) return false;
    this.mark(key, ttlMs, now);
    return true;
  }

  clear() {
    this.map.clear();
  }
}

module.exports = new IdempotencyStore();
