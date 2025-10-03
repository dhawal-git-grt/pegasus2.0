require('dotenv').config();
const { cleanEnv, str, port } = require('envalid');

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: 'development' }),
  PORT: port({ default: 3000 }),
  LOG_LEVEL: str({ default: 'info' }),
  ZOOM_API_KEY: str({ default: '' }),
  ZOOM_API_SECRET: str({ default: '' }),
  ZOOM_ACCOUNT_ID: str({ default: '' }),
});

module.exports = env;
