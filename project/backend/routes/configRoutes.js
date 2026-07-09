const { Router } = require('express');
const configController = require('../controllers/configController');

const router = Router();

router.get('/', configController.obter);
router.put('/', configController.atualizar);

module.exports = router;
