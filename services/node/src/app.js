const express = require('express');
const logger = require('./logger');
const liveClassesRouter = require('./routes/liveClasses');
const zoomWebhookRouter = require('./routes/webhooks/zoom');

const app = express();
app.use((req, _res, next) => {
  req.log = logger;
  next();
});

// Webhooks: mount before express.json to allow raw body parsing in route
app.use('/webhooks/zoom', zoomWebhookRouter);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/live-classes', liveClassesRouter);

module.exports = app;
