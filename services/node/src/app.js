const express = require('express');
const logger = require('./logger');
const liveClassesRouter = require('./routes/liveClasses');

const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = logger;
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/live-classes', liveClassesRouter);

module.exports = app;
