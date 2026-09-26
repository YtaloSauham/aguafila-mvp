const esteiraRepository = require('../repositories/esteiraRepository');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/AppError');

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

async function criar({ nome }) {
  const nomeLimpo = String(nome ?? '').trim();
  if (!nomeLimpo) {
    throw new ValidationError('Nome da esteira é obrigatório.');
  }

  try {
    return await esteiraRepository.criar({ nome: nomeLimpo });
  } catch (erro) {
    if (erro?.code === 'ER_DUP_ENTRY') {
      throw new ConflictError(`A esteira "${nomeLimpo}" já existe.`);
    }
    throw erro;
  }
}

async function remover(id) {
  const esteira = await buscarPorId(id);
  if (esteira.status === 'OCUPADA') {
    throw new ConflictError(`Não é possível remover a esteira "${esteira.nome}" enquanto estiver ocupada.`);
  }

  const removida = await esteiraRepository.remover(id);
  if (!removida) {
    throw new NotFoundError(`Esteira ${id} não encontrada.`);
  }

  return { id: Number(id), removida: true };
}

module.exports = { listarTodas, buscarPorId, criar, remover };
