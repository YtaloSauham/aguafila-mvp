/**
 * Executa o script sql/seed.sql contra o banco configurado no .env.
 * Uso: npm run db:seed
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');
const logger = require('../utils/logger');

async function seed() {
  const seedPath = path.join(__dirname, '..', '..', 'sql', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    multipleStatements: true,
  });

  try {
    logger.info('Executando seed (sql/seed.sql)...');
    await connection.query(sql);
    logger.info('Seed aplicado com sucesso.');
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  logger.error('Falha ao aplicar seed.', err);
  process.exit(1);
});
