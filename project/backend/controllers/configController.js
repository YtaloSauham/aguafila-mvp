const configService = require('../services/configService');
const asyncHandler = require('../utils/asyncHandler');

const obter = asyncHandler(async (req, res) => {
  const config = await configService.obterConfiguracao();
  res.status(200).json({ sucesso: true, dados: config });
});

const atualizar = asyncHandler(async (req, res) => {
  const config = await configService.atualizarConfiguracao(req.body);
  res.status(200).json({ sucesso: true, dados: config });
});

module.exports = { obter, atualizar };
