/**
 * Executa o script sql/schema.sql contra o banco configurado no .env.
 * Uso: npm run db:migrate
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');
const logger = require('../utils/logger');

async function migrate() {
  const schemaPath = path.join(__dirname, '..', '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Conecta sem banco selecionado, pois o schema cria o database.
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  try {
    logger.info('Executando migrations (sql/schema.sql)...');
    await connection.query(sql);
    logger.info('Migrations aplicadas com sucesso.');
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  logger.error('Falha ao aplicar migrations.', err);
  process.exit(1);
});
