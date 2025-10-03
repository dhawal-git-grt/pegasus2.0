const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT,
  zoomApiKey: process.env.ZOOM_API_KEY,
};
