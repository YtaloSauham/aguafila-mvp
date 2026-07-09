const { pool } = require('../config/database');

/**
 * Repository de Esteiras.
 * Responsabilidade única: acesso a dados da tabela `esteiras`.
 */

async function listarTodas(connection = pool) {
  const [rows] = await connection.query(
    `SELECT id, nome, status, senha_atual_id, ultima_atualizacao
     FROM esteiras
     ORDER BY id ASC`
  );
  return rows;
}

async function buscarPorId(id, connection = pool) {
  const [rows] = await connection.query(
    `SELECT id, nome, status, senha_atual_id, ultima_atualizacao
     FROM esteiras WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Bloqueia a linha da esteira para leitura dentro de uma transação
 * (SELECT ... FOR UPDATE), evitando condição de corrida ao chamar
 * duas senhas simultaneamente para a mesma esteira.
 */
async function buscarPorIdComLock(id, connection) {
  const [rows] = await connection.query(
    `SELECT id, nome, status, senha_atual_id
     FROM esteiras WHERE id = ? FOR UPDATE`,
    [id]
  );
  return rows[0] || null;
}

async function atualizarStatus(id, status, senhaAtualId, connection = pool) {
  await connection.query(
    `UPDATE esteiras
     SET status = ?, senha_atual_id = ?, ultima_atualizacao = NOW()
     WHERE id = ?`,
    [status, senhaAtualId, id]
  );
  return buscarPorId(id, connection);
}

module.exports = {
  listarTodas,
  buscarPorId,
  buscarPorIdComLock,
  atualizarStatus,
};
