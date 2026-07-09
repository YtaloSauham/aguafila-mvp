/**
 * Envolve funções assíncronas de controller para encaminhar erros
 * automaticamente ao middleware global de tratamento de exceções,
 * evitando try/catch repetido em cada controller.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
