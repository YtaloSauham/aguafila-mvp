const { Router } = require('express');
const { param, body } = require('express-validator');
const senhaController = require('../controllers/senhaController');
const validate = require('../middlewares/validate');

const router = Router();

// POST /api/senhas -> Emitir Senha (Terminal)
router.post('/', senhaController.emitir);

// GET /api/senhas -> Listar Senhas (Operador). Filtro opcional ?status=AGUARDANDO
router.get('/', senhaController.listar);

// GET /api/senhas/:id
router.get(
  '/:id',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  senhaController.buscarPorId
);

// PUT /api/senhas/:id/chamar -> Chamar Senha
router.put(
  '/:id/chamar',
  [
    param('id').isInt().withMessage('id deve ser numérico'),
    body('esteiraId').isInt().withMessage('esteiraId é obrigatório e deve ser numérico'),
  ],
  validate,
  senhaController.chamar
);

// PUT /api/senhas/:id/repetir -> Repetir chamada
router.put(
  '/:id/repetir',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  senhaController.repetir
);

// PUT /api/senhas/:id/finalizar -> Finalizar atendimento
router.put(
  '/:id/finalizar',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  senhaController.finalizar
);

// PUT /api/senhas/:id/cancelar -> Cancelar senha
router.put(
  '/:id/cancelar',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  senhaController.cancelar
);

module.exports = router;
