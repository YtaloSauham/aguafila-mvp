const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/database');
const { inicializar } = require('./realtime/socketManager');
const logger = require('./utils/logger');

let httpServerAtivo = null;

async function iniciar() {
  try {
    await testConnection();

    const portas = [env.server.port, 3000, 3001, 3002, 3003, 3004, 3005];
    const portasDisponiveis = [...new Set(portas.filter((porta) => Number.isInteger(porta) && porta > 0))];

    const tentarPorta = (indice) => {
      if (indice >= portasDisponiveis.length) {
        logger.error('Nenhuma porta disponível para iniciar o servidor.');
        process.exit(1);
        return;
      }

      const porta = portasDisponiveis[indice];
      const httpServer = http.createServer(app);
      inicializar(httpServer);

      httpServer.once('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          logger.warn(`Porta ${porta} já está em uso. Tentando ${portasDisponiveis[indice + 1] || 'outra porta'}...`);
          tentarPorta(indice + 1);
          return;
        }

        logger.error(`Falha ao iniciar o servidor na porta ${porta}.`, error);
        process.exit(1);
      });

      httpServer.listen(porta, () => {
        httpServerAtivo = httpServer;
        logger.info(`Servidor rodando em http://localhost:${porta}`);
        logger.info(`Terminal:  http://localhost:${porta}/terminal`);
        logger.info(`Operador:  http://localhost:${porta}/operador`);
        logger.info(`Painel:    http://localhost:${porta}/painel`);
      });
    };

    tentarPorta(0);

    process.on('SIGTERM', () => encerrar());
    process.on('SIGINT', () => encerrar());
  } catch (error) {
    logger.error('Falha ao iniciar o servidor.', error);
    process.exit(1);
  }
}

function encerrar() {
  logger.info('Encerrando servidor...');
  if (!httpServerAtivo) {
    logger.info('Servidor encerrado.');
    process.exit(0);
    return;
  }

  httpServerAtivo.close(() => {
    logger.info('Servidor encerrado.');
    process.exit(0);
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

iniciar();
