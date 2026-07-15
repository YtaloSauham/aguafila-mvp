(() => {
  window.AGUAFILA_API_BASE_URL = '/api';
  window.AGUAFILA_SOCKET_URL = undefined;

  async function loadConfig() {
    try {
      const response = await fetch('/assets/config.json', { cache: 'no-store' });
      if (!response.ok) return;

      const config = await response.json();
      if (config.apiBaseUrl) {
        window.AGUAFILA_API_BASE_URL = config.apiBaseUrl;
      }
      if (typeof config.socketUrl === 'string' && config.socketUrl.trim() !== '') {
        window.AGUAFILA_SOCKET_URL = config.socketUrl.trim();
      }
    } catch (error) {
      console.warn('Aguafila: falha ao carregar /assets/config.json.', error);
    }
  }

  loadConfig();
})();
