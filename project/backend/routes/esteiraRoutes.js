const { Router } = require('express');
const { param } = require('express-validator');
const esteiraController = require('../controllers/esteiraController');
const validate = require('../middlewares/validate');

const router = Router();

router.get('/', esteiraController.listar);

router.get(
  '/:id',
  [param('id').isInt().withMessage('id deve ser numérico')],
  validate,
  esteiraController.buscarPorId
);

module.exports = router;
