const config = require('../config');
const mock = require('./zoomMock');
const api = require('./zoomApi');

module.exports = config.ZOOM_USE_MOCK ? mock : api;
