/**
 * Cliente HTTP minimalista para a REST API do backend.
 * Compartilhado pelas três interfaces (Terminal, Operador, Painel).
 * Sem dependências externas — usa fetch nativo do navegador.
 */
const Api = (() => {
  const API_BASE_URL = window.AGUAFILA_API_BASE_URL || '/api';

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const requestOptions = {
      ...options,
      cache: 'no-store',
      headers,
    };

    const baseUrl = API_BASE_URL.replace(/\/?$/, '');
    const url = `${baseUrl}${path}`;

    const resposta = await fetch(url, requestOptions);
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok) {
      const mensagem = corpo?.erro?.mensagem || `Erro HTTP ${resposta.status}`;
      const erro = new Error(mensagem);
      erro.status = resposta.status;
      erro.detalhes = corpo?.erro?.detalhes;
      throw erro;
    }

    return corpo?.dados;
  }

  return {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
    delete: (path, body) => request(path, { method: 'DELETE', body: JSON.stringify(body || {}) }),
  };
})();
