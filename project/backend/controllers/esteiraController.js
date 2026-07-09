const esteiraService = require('../services/esteiraService');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const esteiras = await esteiraService.listarTodas();
  res.status(200).json({ sucesso: true, dados: esteiras });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const esteira = await esteiraService.buscarPorId(req.params.id);
  res.status(200).json({ sucesso: true, dados: esteira });
});

module.exports = { listar, buscarPorId };
