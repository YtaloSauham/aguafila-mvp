const { Router } = require('express');
const senhaRoutes = require('./senhaRoutes');
const esteiraRoutes = require('./esteiraRoutes');
const painelRoutes = require('./painelRoutes');
const configRoutes = require('./configRoutes');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    sucesso: true,
    dados: {
      sistema: 'Gerenciamento de Atendimento - Abastecimento de Água',
      versao: '1.0.0',
      endpoints: [
        'POST   /api/senhas',
        'GET    /api/senhas',
        'GET    /api/senhas/:id',
        'PUT    /api/senhas/:id/chamar',
        'PUT    /api/senhas/:id/repetir',
        'PUT    /api/senhas/:id/finalizar',
        'PUT    /api/senhas/:id/cancelar',
        'GET    /api/esteiras',
        'GET    /api/esteiras/:id',
        'GET    /api/painel',
        'GET    /api/configuracoes',
        'PUT    /api/configuracoes',
      ],
    },
  });
});

router.use('/senhas', senhaRoutes);
router.use('/esteiras', esteiraRoutes);
router.use('/painel', painelRoutes);
router.use('/configuracoes', configRoutes);

module.exports = router;
