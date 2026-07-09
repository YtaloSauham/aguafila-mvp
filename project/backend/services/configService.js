const configRepository = require('../repositories/configRepository');
const { NotFoundError } = require('../utils/AppError');

/**
 * ConfigService: leitura e atualização das configurações gerais do
 * sistema (empresa, áudio, volume, impressora, mensagem do painel).
 */

const CAMPOS_PERMITIDOS = [
  'empresa',
  'audio',
  'volume',
  'impressora',
  'porta',
  'reinicio_diario',
  'mensagem_painel',
];

async function obterConfiguracao() {
  const config = await configRepository.buscar();
  if (!config) {
    throw new NotFoundError('Configuração do sistema não encontrada. Execute o seed inicial.');
  }
  return config;
}

async function atualizarConfiguracao(dados) {
  const camposValidos = {};
  for (const campo of CAMPOS_PERMITIDOS) {
    if (dados[campo] !== undefined) {
      camposValidos[campo] = dados[campo];
    }
  }
  return configRepository.atualizar(camposValidos);
}

module.exports = { obterConfiguracao, atualizarConfiguracao };
