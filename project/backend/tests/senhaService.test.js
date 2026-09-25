const test = require('node:test');
const assert = require('node:assert/strict');

const { formatarNumero } = require('../services/senhaService');

test('formatarNumero gera código da senha normal', () => {
  assert.equal(formatarNumero(15, 'NORMAL'), 'A015');
});

test('formatarNumero gera código da senha prioritária', () => {
  assert.equal(formatarNumero(7, 'PRIORIDADE'), 'P007');
});
