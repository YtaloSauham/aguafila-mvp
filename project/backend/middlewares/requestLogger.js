const logger = require('../utils/logger');

/**
 * Middleware simples de log de requisições HTTP.
 * Registra método, rota, status e tempo de resposta.
 */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs.toFixed(1)}ms)`);
  });

  next();
}

module.exports = requestLogger;
