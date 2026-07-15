const http = require('http');
const os = require('os');
const app = require('./app');
const env = require('./config/env');
const { testConnection } = require('./config/database');
const { inicializar } = require('./realtime/socketManager');
const logger = require('./utils/logger');

let httpServerAtivo = null;

function getLocalNetworkAddress() {
  const interfaces = os.networkInterfaces();

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }

  return '127.0.0.1';
}

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

      httpServer.listen(porta, env.server.host, () => {
        httpServerAtivo = httpServer;
        const hostDisplay = env.server.host === '0.0.0.0' ? getLocalNetworkAddress() : env.server.host;
        logger.info(`Servidor rodando em http://${hostDisplay}:${porta}`);
        logger.info(`Terminal:  http://${hostDisplay}:${porta}/terminal`);
        logger.info(`Operador:  http://${hostDisplay}:${porta}/operador`);
        logger.info(`Painel:    http://${hostDisplay}:${porta}/painel`);

        if (env.server.host === '0.0.0.0') {
          logger.info(`Acesse localmente: http://localhost:${porta}`);
          logger.info(`Acesse na rede local: http://${hostDisplay}:${porta}`);
        }
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
