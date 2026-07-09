const senhaService = require('../services/senhaService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * SenhaController: traduz requisições HTTP em chamadas ao SenhaService.
 * Nenhuma regra de negócio deve existir aqui — apenas orquestração
 * de entrada/saída (RN livre).
 */

const emitir = asyncHandler(async (req, res) => {
  const resultado = await senhaService.gerarSenha();
  res.status(201).json({ sucesso: true, dados: resultado });
});

const listar = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const senhas = await senhaService.listarFila({ status });
  res.status(200).json({ sucesso: true, dados: senhas });
});

const buscarPorId = asyncHandler(async (req, res) => {
  const senha = await senhaService.buscarPorId(req.params.id);
  res.status(200).json({ sucesso: true, dados: senha });
});

const chamar = asyncHandler(async (req, res) => {
  const { esteiraId } = req.body;
  const resultado = await senhaService.chamarSenha({
    senhaId: req.params.id,
    esteiraId,
  });
  res.status(200).json({ sucesso: true, dados: resultado });
});

const repetir = asyncHandler(async (req, res) => {
  const resultado = await senhaService.repetirChamada(req.params.id);
  res.status(200).json({ sucesso: true, dados: resultado });
});

const finalizar = asyncHandler(async (req, res) => {
  const resultado = await senhaService.finalizarAtendimento(req.params.id);
  res.status(200).json({ sucesso: true, dados: resultado });
});

const cancelar = asyncHandler(async (req, res) => {
  const senha = await senhaService.cancelarSenha(req.params.id);
  res.status(200).json({ sucesso: true, dados: senha });
});

module.exports = { emitir, listar, buscarPorId, chamar, repetir, finalizar, cancelar };
