const esteiraRepository = require('../repositories/esteiraRepository');
const { NotFoundError } = require('../utils/AppError');

/**
 * EsteiraService: regras de negócio relacionadas às esteiras (RN005, RN007).
 * A transição de estado ao chamar/finalizar uma senha é orquestrada pelo
 * SenhaService (que precisa alterar senha + esteira de forma atômica).
 */

async function listarTodas() {
  return esteiraRepository.listarTodas();
}

async function buscarPorId(id) {
  const esteira = await esteiraRepository.buscarPorId(id);
  if (!esteira) {
    throw new NotFoundError(`Esteira ${id} não encontrada.`);
  }
  return esteira;
}

module.exports = { listarTodas, buscarPorId };
