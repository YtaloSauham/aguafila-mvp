const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/AppError');

/**
 * Executa as validações do express-validator registradas na rota
 * e converte falhas em um ValidationError padronizado (422),
 * repassado ao middleware global de erros.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const details = errors.array().map((e) => ({
    campo: e.path,
    mensagem: e.msg,
  }));

  next(new ValidationError('Dados de entrada inválidos.', details));
}

module.exports = validate;
