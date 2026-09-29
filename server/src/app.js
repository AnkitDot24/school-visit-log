const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { corsOrigins } = require('./config/env');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({
    origin(origin, callback) {
                                                            
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => logger.info(`${req.method} ${req.originalUrl} ${res.statusCode}`, `${Date.now() - started}ms`));
    next();
  });

  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
