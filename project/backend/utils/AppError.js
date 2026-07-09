/**
 * Erro de aplicação padronizado.
 * Services lançam AppError (ou subclasses) para representar violações
 * de regras de negócio; o middleware global traduz isso em respostas HTTP.
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Dados inválidos.', details = []) {
    super(message, 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflito de estado.') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = { AppError, NotFoundError, ValidationError, ConflictError };
