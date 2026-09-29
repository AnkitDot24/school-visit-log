const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details) error.details = details;
  res.status(status).json({ error });
}

function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`);
}

                                          
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return sendError(res, err.status, err.code, err.message, err.details);
  }
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'INVALID_JSON', 'The request body is not valid JSON.');
  }
  if (err.type === 'entity.too.large') {
    return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'The request body is too large.');
  }
  logger.error(`${err.message}${err.stack ? `\n${err.stack}` : ''}`);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong on the server.');
}

module.exports = { notFoundHandler, errorHandler };
