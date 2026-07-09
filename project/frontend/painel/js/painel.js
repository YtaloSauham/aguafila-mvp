/**
 * Lógica do Painel Público.
 * Exibe: senha atual por esteira, últimas chamadas, logotipo/empresa,
 * relógio e mensagem institucional (seção 11). Atualiza em tempo real
 * via Socket.IO e reproduz o áudio de cada chamada (seção 12).
 */
(() => {
  const elEsteiras = document.getElementById('pn-esteiras');
  const elHistoricoLista = document.getElementById('pn-historico-lista');
  const elRelogio = document.getElementById('pn-relogio');
  const elEmpresa = document.getElementById('pn-empresa');
  const elMensagem = document.getElementById('pn-mensagem');
  const templateEsteira = document.getElementById('template-pn-esteira');

  function atualizarRelogio() {
    elRelogio.textContent = new Date().toLocaleTimeString('pt-BR');
  }

  function formatarHora(dataIso) {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function renderizarEsteiras(esteiras, esteiraDestacadaId) {
    elEsteiras.innerHTML = '';
    esteiras.forEach((esteira) => {
      const node = templateEsteira.content.cloneNode(true);
      const card = node.querySelector('.pn-card');
      card.dataset.status = esteira.status;
      if (esteira.id === esteiraDestacadaId) {
        card.classList.add('pn-card--pulsar');
      }

      node.querySelector('.pn-card__nome').textContent = esteira.nome;
      node.querySelector('.pn-card__numero').textContent = esteira.senha_atual
        ? esteira.senha_atual.numero
        : '—';

      const badge = node.querySelector('.pn-card__badge');
      badge.textContent = esteira.status === 'LIVRE' ? 'Livre' : 'Chamando';
      badge.classList.add(esteira.status === 'LIVRE' ? 'badge--finalizada' : 'badge--em-atendimento');

      elEsteiras.appendChild(node);
    });
  }

  function renderizarHistorico(ultimasChamadas) {
    elHistoricoLista.innerHTML = '';
    (ultimasChamadas || []).forEach((senha) => {
      const li = document.createElement('li');
      li.innerHTML = `${senha.numero} <span>${senha.esteira_nome || ''} · ${formatarHora(senha.hora_chamada)}</span>`;
      elHistoricoLista.appendChild(li);
    });
  }

  async function carregarEstado(esteiraDestacadaId = null) {
    try {
      const estado = await Api.get('/painel');
      renderizarEsteiras(estado.esteiras, esteiraDestacadaId);
      renderizarHistorico(estado.ultimasChamadas);
      if (estado.empresa) elEmpresa.textContent = estado.empresa;
      if (estado.mensagemPainel) elMensagem.textContent = estado.mensagemPainel;
    } catch (erro) {
      console.error('Falha ao carregar estado do painel:', erro);
    }
  }

  // --- Desbloqueio de áudio no primeiro toque/clique na tela ---
  document.addEventListener('click', () => AudioPlayer.desbloquear(), { once: true });
  document.addEventListener('keydown', () => AudioPlayer.desbloquear(), { once: true });

  // --- Tempo real ---
  const socket = io();

  socket.on('connect', () => carregarEstado());

  socket.on('senha:chamada', (payload) => {
    AudioPlayer.reproduzir(payload);
    carregarEstado();
  });

  ['senha:criada', 'senha:cancelada', 'atendimento:finalizado', 'esteira:liberada', 'painel:atualizacao']
    .forEach((evento) => socket.on(evento, () => carregarEstado()));

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);
  carregarEstado();
})();
