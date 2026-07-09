const painelService = require('../services/painelService');
const asyncHandler = require('../utils/asyncHandler');

const obter = asyncHandler(async (req, res) => {
  const estado = await painelService.obterEstadoPainel();
  res.status(200).json({ sucesso: true, dados: estado });
});

module.exports = { obter };
