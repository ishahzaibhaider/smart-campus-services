const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./middleware/logger');
const sanitize = require('./middleware/sanitize');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { corsOrigins } = require('./config/env');

function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet()); // security headers (CSP, X-Content-Type-Options, frame protection, ...)
  app.use(cors({
    origin: corsOrigins, // only the listed front-ends may call the API from a browser
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Location']
  }));
  app.use(express.json({ limit: '100kb' })); // large bodies are refused (DoS protection)
  app.use(sanitize);
  app.use(logger);

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api', require('./routes'));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
