/**
 * Cliente HTTP minimalista para a REST API do backend.
 * Compartilhado pelas três interfaces (Terminal, Operador, Painel).
 * Sem dependências externas — usa fetch nativo do navegador.
 */
const Api = (() => {
  const BASE_URLS = ['/api', 'http://localhost:3000/api', 'http://localhost:3001/api'];

  async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const requestOptions = {
      ...options,
      cache: 'no-store',
      headers,
    };

    let ultimoErro = null;

    for (const baseUrl of BASE_URLS) {
      try {
        const resposta = await fetch(`${baseUrl}${path}`, requestOptions);
        const corpo = await resposta.json().catch(() => null);

        if (!resposta.ok) {
          const mensagem = corpo?.erro?.mensagem || `Erro HTTP ${resposta.status}`;
          const erro = new Error(mensagem);
          erro.status = resposta.status;
          erro.detalhes = corpo?.erro?.detalhes;
          throw erro;
        }

        return corpo?.dados;
      } catch (erro) {
        ultimoErro = erro;
      }
    }

    throw ultimoErro || new Error('Não foi possível conectar ao servidor.');
  }

  return {
    get: (path) => request(path, { method: 'GET' }),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  };
})();
