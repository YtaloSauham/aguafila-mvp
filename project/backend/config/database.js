/**
 * Pool de conexões com o MariaDB.
 * Utiliza mysql2/promise para permitir uso de async/await nos repositories.
 */
const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
  dateStrings: false,
  timezone: 'local',
});

/**
 * Testa a conexão com o banco na inicialização do servidor.
 * Falha rápida (fail-fast) é preferível a um servidor "no ar" sem banco.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info(`Conectado ao MariaDB em ${env.db.host}:${env.db.port}/${env.db.database}`);
  } catch (error) {
    logger.error('Falha ao conectar ao MariaDB.', error);
    throw error;
  }
}

module.exports = { pool, testConnection };
