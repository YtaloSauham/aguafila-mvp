const { pool } = require('../config/database');

/**
 * Repository de Senhas.
 * Responsabilidade única: acesso a dados da tabela `senhas`.
 * Nenhuma regra de negócio deve existir aqui (isso pertence aos Services).
 */

const SELECT_BASE = `
  SELECT
    s.id, s.numero, s.sequencial, s.data,
    s.hora_emissao, s.hora_chamada, s.hora_inicio, s.hora_finalizacao,
    s.status, s.esteira_id,
    e.nome AS esteira_nome
  FROM senhas s
  LEFT JOIN esteiras e ON e.id = s.esteira_id
`;

async function criar({ numero, sequencial, data }, connection = pool) {
  const [result] = await connection.query(
    `INSERT INTO senhas (numero, sequencial, data, status, hora_emissao)
     VALUES (?, ?, ?, 'AGUARDANDO', NOW())`,
    [numero, sequencial, data]
  );
  return buscarPorId(result.insertId, connection);
}

async function buscarPorId(id, connection = pool) {
  const [rows] = await connection.query(`${SELECT_BASE} WHERE s.id = ?`, [id]);
  return rows[0] || null;
}

async function listarPorData(data, connection = pool) {
  const [rows] = await connection.query(
    `${SELECT_BASE} WHERE s.data = ? ORDER BY s.sequencial ASC`,
    [data]
  );
  return rows;
}

async function listarAguardandoPorData(data, connection = pool) {
  const [rows] = await connection.query(
    `${SELECT_BASE} WHERE s.data = ? AND s.status = 'AGUARDANDO' ORDER BY s.sequencial ASC`,
    [data]
  );
  return rows;
}

async function buscarUltimoSequencialDoDia(data, connection = pool) {
  const [rows] = await connection.query(
    `SELECT MAX(sequencial) AS ultimo FROM senhas WHERE data = ?`,
    [data]
  );
  return rows[0]?.ultimo || 0;
}

async function atualizarStatus(id, status, camposExtras = {}, connection = pool) {
  const campos = ['status = ?'];
  const valores = [status];

  for (const [coluna, valor] of Object.entries(camposExtras)) {
    campos.push(`${coluna} = ?`);
    valores.push(valor);
  }

  valores.push(id);

  await connection.query(
    `UPDATE senhas SET ${campos.join(', ')} WHERE id = ?`,
    valores
  );
  return buscarPorId(id, connection);
}

async function listarUltimasChamadas(data, limite = 5, connection = pool) {
  const [rows] = await connection.query(
    `${SELECT_BASE}
     WHERE s.data = ? AND s.hora_chamada IS NOT NULL
     ORDER BY s.hora_chamada DESC
     LIMIT ?`,
    [data, limite]
  );
  return rows;
}

async function buscarChamadaAtualPorEsteira(esteiraId, connection = pool) {
  const [rows] = await connection.query(
    `${SELECT_BASE}
     WHERE s.esteira_id = ? AND s.status IN ('CHAMADA', 'EM_ATENDIMENTO')
     ORDER BY s.hora_chamada DESC
     LIMIT 1`,
    [esteiraId]
  );
  return rows[0] || null;
}

module.exports = {
  criar,
  buscarPorId,
  listarPorData,
  listarAguardandoPorData,
  buscarUltimoSequencialDoDia,
  atualizarStatus,
  listarUltimasChamadas,
  buscarChamadaAtualPorEsteira,
};
