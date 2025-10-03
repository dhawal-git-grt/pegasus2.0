const pino = require('pino');
const config = require('./config');

const logger = pino({
  level: config.LOG_LEVEL,
  base: { service: 'edtech-node' },
  ...(config.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});

module.exports = logger;
