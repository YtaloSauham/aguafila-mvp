const senhaRepository = require('../repositories/senhaRepository');
const esteiraRepository = require('../repositories/esteiraRepository');
const configRepository = require('../repositories/configRepository');
const senhaService = require('./senhaService');

/**
 * PainelService: monta a "fotografia" atual do painel público
 * (seção 11): senha atual por esteira, últimas chamadas e mensagem
 * institucional. Não contém regra de transição de estado — apenas leitura.
 */

async function obterEstadoPainel() {
  const hoje = senhaService.dataDeHoje();

  const [esteiras, ultimasChamadas, config] = await Promise.all([
    esteiraRepository.listarTodas(),
    senhaRepository.listarUltimasChamadas(hoje, 5),
    configRepository.buscar(),
  ]);

  const esteirasComSenhaAtual = await Promise.all(
    esteiras.map(async (esteira) => {
      const senhaAtual = esteira.senha_atual_id
        ? await senhaRepository.buscarPorId(esteira.senha_atual_id)
        : null;
      return { ...esteira, senha_atual: senhaAtual };
    })
  );

  return {
    esteiras: esteirasComSenhaAtual,
    ultimasChamadas,
    mensagemPainel: config?.mensagem_painel || '',
    empresa: config?.empresa || '',
    dataReferencia: hoje,
  };
}

module.exports = { obterEstadoPainel };
