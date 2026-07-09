const { Server } = require('socket.io');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * Gerenciador único (singleton) da instância do Socket.IO.
 * Services não conhecem detalhes de transporte: apenas chamam `emitir(evento, payload)`.
 * Isso mantém a camada de tempo real desacoplada da lógica de negócio.
 */

let io = null;

/**
 * Eventos mínimos exigidos pela especificação (seção 14).
 */
const EVENTOS = {
  SENHA_CRIADA: 'senha:criada',
  SENHA_CHAMADA: 'senha:chamada',
  SENHA_REPETIDA: 'senha:repetida',
  ATENDIMENTO_FINALIZADO: 'atendimento:finalizado',
  SENHA_CANCELADA: 'senha:cancelada',
  ESTEIRA_LIBERADA: 'esteira:liberada',
  ATUALIZACAO_PAINEL: 'painel:atualizacao',
};

function inicializar(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.cors.origin,
      methods: ['GET', 'POST', 'PUT'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Cliente conectado via Socket.IO: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.debug(`Cliente desconectado: ${socket.id}`);
    });
  });

  logger.info('Socket.IO inicializado.');
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO ainda não foi inicializado. Chame inicializar() no server.js primeiro.');
  }
  return io;
}

function emitir(evento, payload) {
  if (!io) {
    logger.warn(`Tentativa de emitir evento "${evento}" antes da inicialização do Socket.IO.`);
    return;
  }
  io.emit(evento, payload);
  logger.debug(`Evento emitido: ${evento}`, payload);
}

module.exports = { inicializar, getIO, emitir, EVENTOS };
