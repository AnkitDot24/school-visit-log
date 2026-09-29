const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);

async function connectDb() {
  const startedAt = Date.now();
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  logger.info(`[Database] Connected successfully to School Visit Log MongoDB: ${mongoose.connection.name}`, `(${Date.now() - startedAt}ms)`);
  return mongoose.connection;
}

async function disconnectDb() {
  await mongoose.disconnect();
  logger.info('[Database] Disconnected');
}

mongoose.connection.on('error', (error) => logger.error(`[Database] ${error.message}`));
mongoose.connection.on('disconnected', () => logger.warn('[Database] Connection lost'));

module.exports = { connectDb, disconnectDb };
