// Express replaces the hand-written http/url routing of Assignment 1
const express = require('express');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const { errorHandler } = require('./middleware/errorHandler');
const { categories, users } = require('./routes/lookup.routes');

function createApp() {
  const app = express();
  app.use(express.json());   // middleware: parses JSON bodies
  app.use(logger);           // middleware: logs method, URL, status, time

  app.get('/', (req, res) => res.json({ name: 'Smart Campus Service Requests (Assignment 2)', resources: ['/requests', '/categories', '/users'] }));
  app.use('/requests', require('./routes/requests.routes')); // routers
  app.use('/categories', categories);
  app.use('/users', users);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
