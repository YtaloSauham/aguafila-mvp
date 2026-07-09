const { pool } = require('../config/database');

/**
 * Executa `fn(connection)` dentro de uma transação MariaDB.
 * Garante commit em caso de sucesso e rollback automático em caso de erro.
 * Usado sempre que uma operação precisa alterar mais de uma tabela de
 * forma atômica (ex.: chamar senha altera `senhas` e `esteiras` juntas).
 */
async function withTransaction(fn) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const resultado = await fn(connection);
    await connection.commit();
    return resultado;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = withTransaction;
