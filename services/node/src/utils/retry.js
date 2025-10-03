async function retry(fn, { retries = 3, delayMs = 200, factor = 2 } = {}) {
  let attempt = 0;
  let lastErr;
  let wait = delayMs;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, wait));
      wait *= factor;
      attempt += 1;
    }
  }
  throw lastErr;
}

module.exports = { retry };
