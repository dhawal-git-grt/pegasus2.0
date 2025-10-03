const store = require('../src/stores/idempotencyStore');

describe('idempotencyStore', () => {
  beforeEach(() => store.clear());

  test('checkAndMark returns true first time, false on duplicate', () => {
    const key = 'k1';
    const ok1 = store.checkAndMark(key, 1000, Date.now());
    const ok2 = store.checkAndMark(key, 1000, Date.now());
    expect(ok1).toBe(true);
    expect(ok2).toBe(false);
  });

  test('entry expires after TTL', () => {
    const key = 'k2';
    const now = Date.now();
    expect(store.checkAndMark(key, 10, now)).toBe(true);
    // after 20ms, should expire
    expect(store.checkAndMark(key, 10, now + 20)).toBe(true);
  });
});
