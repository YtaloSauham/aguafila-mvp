const { Router } = require('express');
const { param, body } = require('express-validator');
const esteiraController = require('../controllers/esteiraController');
const validate = require('../middlewares/validate');

const router = Router();

router.get('/', esteiraController.listar);

router.post(
  '/',
  [body('nome').trim().isLength({ min: 1, max: 50 }).withMessage('nome é obrigatório e deve ter até 50 caracteres')],
  validate,
  esteiraController.criar
);

router.get(
  '/:id',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  esteiraController.buscarPorId
);

router.delete(
  '/:id',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  esteiraController.remover
);

module.exports = router;
