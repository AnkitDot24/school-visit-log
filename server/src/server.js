const { port, corsOrigins } = require('./config/env');
const { connectDb, disconnectDb } = require('./config/db');
const { createApp } = require('./app');
const logger = require('./utils/logger');

async function start() {
  const startedAt = Date.now();
  logger.info('School Visit Log - Backend Server');
  logger.info('Connecting to MongoDB...');
  await connectDb();
  const server = createApp().listen(port, '0.0.0.0', () => {
    logger.info(`Server running at http://localhost:${port}/api`);
    logger.info(`Allowed CORS origins: ${corsOrigins.join(', ')}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Startup completed in ${Date.now() - startedAt}ms`);
  });

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info('Shutting down gracefully...');
    server.close(() => disconnectDb().finally(() => process.exit(0)));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
  process.exit(1);
});
