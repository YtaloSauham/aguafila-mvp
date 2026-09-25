const senhaRepository = require('../repositories/senhaRepository');
const esteiraRepository = require('../repositories/esteiraRepository');
const printerService = require('./printerService');
const audioService = require('./audioService');
const withTransaction = require('../utils/withTransaction');
const { NotFoundError, ConflictError } = require('../utils/AppError');
const { emitir, EVENTOS } = require('../realtime/socketManager');
const logger = require('../utils/logger');

/**
 * SenhaService: contém TODA a regra de negócio relacionada ao ciclo de
 * vida da senha (RN001 a RN013). Controllers apenas chamam estes métodos;
 * Repositories apenas executam SQL. Nenhuma regra deve vazar para essas
 * outras camadas.
 */

const PREFIXOS_SENHA = {
  NORMAL: 'A',
  PRIORIDADE: 'P',
};

function dataDeHoje() {
  // Data local no formato YYYY-MM-DD, usada como chave de reinício diário (RN003).
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarNumero(sequencial, tipo = 'NORMAL') {
  const prefixo = PREFIXOS_SENHA[tipo] || PREFIXOS_SENHA.NORMAL;
  return `${prefixo}${String(sequencial).padStart(3, '0')}`;
}

/**
 * RN001, RN002, RN003, RN004: gera a próxima senha sequencial do dia,
 * garantindo unicidade por data. Salva no banco e aciona a impressão.
 */
async function gerarSenha(tipo = 'NORMAL') {
  const tipoNormalizado = ['NORMAL', 'PRIORIDADE'].includes(tipo) ? tipo : 'NORMAL';
  const hoje = dataDeHoje();

  const senha = await withTransaction(async (connection) => {
    const ultimoSequencial = await senhaRepository.buscarUltimoSequencialDoDia(hoje, connection);
    const proximoSequencial = ultimoSequencial + 1;
    const numero = formatarNumero(proximoSequencial, tipoNormalizado);

    return senhaRepository.criar(
      { numero, sequencial: proximoSequencial, data: hoje },
      connection
    );
  });

  // Impressão não é regra de negócio crítica de consistência de dados:
  // ocorre fora da transação para não travar o banco em caso de impressora lenta/offline.
  const resultadoImpressao = await printerService.imprimirSenha({
    numero: senha.numero,
    data: senha.data,
    horaEmissao: senha.hora_emissao,
  });

  if (!resultadoImpressao.sucesso) {
    logger.warn(`Senha ${senha.numero} emitida, mas impressão falhou: ${resultadoImpressao.mensagem}`);
  }

  emitir(EVENTOS.SENHA_CRIADA, { senha, tipo: tipoNormalizado });
  emitir(EVENTOS.ATUALIZACAO_PAINEL, { motivo: 'senha_criada', tipo: tipoNormalizado });

  return { senha, impressao: resultadoImpressao, tipo: tipoNormalizado };
}

/**
 * Lista a fila do dia atual. Filtro opcional por status.
 */
async function listarFila({ status } = {}) {
  const hoje = dataDeHoje();
  const senhas = await senhaRepository.listarPorData(hoje);
  if (!status) return senhas;
  return senhas.filter((s) => s.status === status);
}

async function buscarPorId(id) {
  const senha = await senhaRepository.buscarPorId(id);
  if (!senha) {
    throw new NotFoundError(`Senha ${id} não encontrada.`);
  }
  return senha;
}

/**
 * RN006, RN007, RN008: chama a próxima senha (ou uma senha específica)
 * para uma esteira livre. Atualiza senha -> EM_ATENDIMENTO e
 * esteira -> OCUPADA de forma atômica.
 */
async function chamarSenha({ senhaId, esteiraId }) {
  const resultado = await withTransaction(async (connection) => {
    const esteira = await esteiraRepository.buscarPorIdComLock(esteiraId, connection);
    if (!esteira) {
      throw new NotFoundError(`Esteira ${esteiraId} não encontrada.`);
    }
    // RN007: somente esteiras LIVRES podem receber uma chamada.
    if (esteira.status !== 'LIVRE') {
      throw new ConflictError(`Esteira "${esteira.nome}" já está OCUPADA.`);
    }

    const senha = await senhaRepository.buscarPorId(senhaId, connection);
    if (!senha) {
      throw new NotFoundError(`Senha ${senhaId} não encontrada.`);
    }
    // RN006: somente senhas AGUARDANDO podem ser chamadas.
    if (senha.status !== 'AGUARDANDO') {
      throw new ConflictError(`Senha "${senha.numero}" não está aguardando (status atual: ${senha.status}).`);
    }

    // RN008: transição de estados.
    const senhaAtualizada = await senhaRepository.atualizarStatus(
      senhaId,
      'EM_ATENDIMENTO',
      { esteira_id: esteiraId, hora_chamada: new Date(), hora_inicio: new Date() },
      connection
    );
    const esteiraAtualizada = await esteiraRepository.atualizarStatus(
      esteiraId,
      'OCUPADA',
      senhaId,
      connection
    );

    return { senha: senhaAtualizada, esteira: esteiraAtualizada };
  });

  // RN010: toda chamada deve gerar áudio.
  audioService.anunciarChamada(resultado.senha, resultado.esteira);
  // RN011: toda chamada deve atualizar o painel instantaneamente.
  emitir(EVENTOS.ATUALIZACAO_PAINEL, { motivo: 'senha_chamada' });

  return resultado;
}

/**
 * RN012: o operador pode repetir a chamada (reforça o áudio e o painel
 * sem alterar o estado da senha/esteira).
 */
async function repetirChamada(senhaId) {
  const senha = await senhaRepository.buscarPorId(senhaId);
  if (!senha) {
    throw new NotFoundError(`Senha ${senhaId} não encontrada.`);
  }
  if (!['CHAMADA', 'EM_ATENDIMENTO'].includes(senha.status)) {
    throw new ConflictError(`Senha "${senha.numero}" não pode ser repetida (status atual: ${senha.status}).`);
  }
  if (!senha.esteira_id) {
    throw new ConflictError(`Senha "${senha.numero}" não está associada a nenhuma esteira.`);
  }

  const esteira = await esteiraRepository.buscarPorId(senha.esteira_id);

  audioService.anunciarChamada(senha, esteira);
  emitir(EVENTOS.SENHA_REPETIDA, { senha, esteira });
  emitir(EVENTOS.ATUALIZACAO_PAINEL, { motivo: 'senha_repetida' });

  return { senha, esteira };
}

/**
 * RN009: finaliza o atendimento. Senha -> FINALIZADA, Esteira -> LIVRE.
 */
async function finalizarAtendimento(senhaId) {
  const resultado = await withTransaction(async (connection) => {
    const senha = await senhaRepository.buscarPorId(senhaId, connection);
    if (!senha) {
      throw new NotFoundError(`Senha ${senhaId} não encontrada.`);
    }
    if (senha.status !== 'EM_ATENDIMENTO') {
      throw new ConflictError(`Senha "${senha.numero}" não está em atendimento (status atual: ${senha.status}).`);
    }

    const senhaAtualizada = await senhaRepository.atualizarStatus(
      senhaId,
      'FINALIZADA',
      { hora_finalizacao: new Date() },
      connection
    );

    let esteiraAtualizada = null;
    if (senha.esteira_id) {
      esteiraAtualizada = await esteiraRepository.atualizarStatus(
        senha.esteira_id,
        'LIVRE',
        null,
        connection
      );
    }

    return { senha: senhaAtualizada, esteira: esteiraAtualizada };
  });

  emitir(EVENTOS.ATENDIMENTO_FINALIZADO, resultado);
  if (resultado.esteira) {
    emitir(EVENTOS.ESTEIRA_LIBERADA, { esteira: resultado.esteira });
  }
  emitir(EVENTOS.ATUALIZACAO_PAINEL, { motivo: 'atendimento_finalizado' });

  return resultado;
}

/**
 * RN013: cancela uma senha antes do atendimento (somente AGUARDANDO).
 */
async function cancelarSenha(senhaId) {
  const senha = await senhaRepository.buscarPorId(senhaId);
  if (!senha) {
    throw new NotFoundError(`Senha ${senhaId} não encontrada.`);
  }
  if (senha.status !== 'AGUARDANDO') {
    throw new ConflictError(`Senha "${senha.numero}" não pode ser cancelada (status atual: ${senha.status}).`);
  }

  const senhaAtualizada = await senhaRepository.atualizarStatus(senhaId, 'CANCELADA');

  emitir(EVENTOS.SENHA_CANCELADA, { senha: senhaAtualizada });
  emitir(EVENTOS.ATUALIZACAO_PAINEL, { motivo: 'senha_cancelada' });

  return senhaAtualizada;
}

module.exports = {
  gerarSenha,
  formatarNumero,
  listarFila,
  buscarPorId,
  chamarSenha,
  repetirChamada,
  finalizarAtendimento,
  cancelarSenha,
  dataDeHoje,
};
