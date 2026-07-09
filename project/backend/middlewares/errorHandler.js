const logger = require('../utils/logger');
const { AppError } = require('../utils/AppError');

/**
 * Middleware global de tratamento de exceções.
 * Deve ser o ÚLTIMO middleware registrado em app.js.
 * Garante que nenhum erro não tratado derrube o processo nem vaze
 * detalhes internos (stack trace) para o cliente em produção.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_ERROR';
  const message = isAppError ? err.message : 'Erro interno do servidor.';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} :: ${message}`);
  }

  const body = {
    sucesso: false,
    erro: {
      codigo: code,
      mensagem: message,
    },
  };

  if (isAppError && err.details) {
    body.erro.detalhes = err.details;
  }

  if (process.env.NODE_ENV === 'development' && !isAppError) {
    body.erro.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    sucesso: false,
    erro: {
      codigo: 'ROUTE_NOT_FOUND',
      mensagem: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
