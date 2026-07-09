const { Router } = require('express');
const painelController = require('../controllers/painelController');

const router = Router();

// GET /api/painel -> Estado atual do painel público
router.get('/', painelController.obter);

module.exports = router;
