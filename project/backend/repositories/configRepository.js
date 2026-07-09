const { pool } = require('../config/database');

/**
 * Repository de Configurações.
 * A tabela `configuracoes` funciona como um registro singleton (id = 1).
 */

async function buscar(connection = pool) {
  const [rows] = await connection.query(
    `SELECT id, empresa, audio, volume, impressora, porta, reinicio_diario, mensagem_painel
     FROM configuracoes WHERE id = 1`
  );
  return rows[0] || null;
}

async function atualizar(dados, connection = pool) {
  const campos = [];
  const valores = [];

  for (const [coluna, valor] of Object.entries(dados)) {
    campos.push(`${coluna} = ?`);
    valores.push(valor);
  }

  if (campos.length === 0) return buscar(connection);

  await connection.query(
    `UPDATE configuracoes SET ${campos.join(', ')} WHERE id = 1`,
    valores
  );
  return buscar(connection);
}

module.exports = { buscar, atualizar };
