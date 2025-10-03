describe('config', () => {
  it('loads defaults without .env', () => {
    jest.resetModules();
    const config = require('../src/config');
    expect(config.PORT).toBeDefined();
    expect(typeof config.PORT).toBe('number');
    expect(config.LOG_LEVEL).toBeDefined();
  });
});
