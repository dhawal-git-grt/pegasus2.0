const app = require('./app');
const config = require('./config');
const logger = require('./logger');

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, 'Node service listening');
});

module.exports = server;
