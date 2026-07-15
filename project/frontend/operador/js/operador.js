/**
 * Lógica do Painel do Operador.
 * Funções (seção 11): visualizar fila, chamar senha, escolher esteira,
 * repetir chamada, finalizar atendimento.
 */
(() => {
  const filaLista = document.getElementById('fila-lista');
  const filaVazia = document.getElementById('fila-vazia');
  const contadorFila = document.getElementById('contador-fila');
  const esteirasGrid = document.getElementById('esteiras-grid');
  const ultimasChamadasLista = document.getElementById('ultimas-chamadas-lista');
  const statusConexao = document.getElementById('status-conexao');
  const statusConexaoTexto = document.getElementById('status-conexao-texto');

  const templateEsteira = document.getElementById('template-esteira');
  const templateFilaItem = document.getElementById('template-fila-item');

  const STATUS_LABEL = {
    AGUARDANDO: 'Aguardando',
    CHAMADA: 'Chamada',
    EM_ATENDIMENTO: 'Em atendimento',
    FINALIZADA: 'Finalizada',
    CANCELADA: 'Cancelada',
  };

  function formatarHora(dataIso) {
    if (!dataIso) return '';
    return new Date(dataIso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  async function carregarTudo() {
    try {
      const [fila, painel] = await Promise.all([
        Api.get('/senhas?status=AGUARDANDO'),
        Api.get('/painel'),
      ]);
      renderizarFila(fila);
      renderizarEsteiras(painel.esteiras, fila);
      renderizarUltimasChamadas(painel.ultimasChamadas);
    } catch (erro) {
      console.error('Falha ao carregar dados do operador:', erro);
    }
  }

  function renderizarFila(fila) {
    filaLista.innerHTML = '';
    contadorFila.textContent = fila.length;
    filaVazia.hidden = fila.length > 0;

    fila.forEach((senha) => {
      const node = templateFilaItem.content.cloneNode(true);
      node.querySelector('.fila-item__numero').textContent = senha.numero;
      node.querySelector('.fila-item__hora').textContent = `Emitida às ${formatarHora(senha.hora_emissao)}`;

      const btnCancelar = node.querySelector('.fila-item__cancelar');
      btnCancelar.addEventListener('click', () => cancelarSenha(senha.id));

      filaLista.appendChild(node);
    });
  }

  function renderizarEsteiras(esteiras, fila) {
    esteirasGrid.innerHTML = '';
    const proximaSenha = fila[0] || null;

    esteiras.forEach((esteira) => {
      const node = templateEsteira.content.cloneNode(true);
      const card = node.querySelector('.esteira-card');
      card.dataset.status = esteira.status;

      node.querySelector('.esteira-card__nome').textContent = esteira.nome;

      const badge = node.querySelector('.esteira-card__badge');
      badge.textContent = esteira.status === 'LIVRE' ? 'Livre' : 'Ocupada';
      badge.classList.add(esteira.status === 'LIVRE' ? 'badge--finalizada' : 'badge--em-atendimento');

      const senhaNumeroEl = node.querySelector('.esteira-card__senha-numero');
      const acoesEl = node.querySelector('.esteira-card__acoes');

      if (esteira.status === 'OCUPADA' && esteira.senha_atual) {
        senhaNumeroEl.textContent = esteira.senha_atual.numero;

        const btnRepetir = document.createElement('button');
        btnRepetir.className = 'esteira-card__botao esteira-card__botao--secundaria';
        btnRepetir.type = 'button';
        btnRepetir.textContent = 'Repetir chamada';
        btnRepetir.addEventListener('click', () => repetirChamada(esteira.senha_atual.id));

        const btnFinalizar = document.createElement('button');
        btnFinalizar.className = 'esteira-card__botao esteira-card__botao--sucesso';
        btnFinalizar.type = 'button';
        btnFinalizar.textContent = 'Finalizar atendimento';
        btnFinalizar.addEventListener('click', () => finalizarAtendimento(esteira.senha_atual.id));

        acoesEl.append(btnRepetir, btnFinalizar);
      } else {
        senhaNumeroEl.textContent = '—';

        const btnChamar = document.createElement('button');
        btnChamar.className = 'esteira-card__botao esteira-card__botao--primaria';
        btnChamar.type = 'button';
        btnChamar.textContent = proximaSenha ? `Chamar próxima (${proximaSenha.numero})` : 'Fila vazia';
        btnChamar.disabled = !proximaSenha;
        btnChamar.addEventListener('click', () => chamarProximaSenha(esteira.id));

        acoesEl.append(btnChamar);
      }

      esteirasGrid.appendChild(node);
    });
  }

  function renderizarUltimasChamadas(ultimasChamadas) {
    ultimasChamadasLista.innerHTML = '';
    if (!ultimasChamadas || ultimasChamadas.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nenhuma chamada ainda';
      li.style.color = 'var(--cinza-aco)';
      li.style.background = 'transparent';
      ultimasChamadasLista.appendChild(li);
      return;
    }
    ultimasChamadas.forEach((senha) => {
      const li = document.createElement('li');
      li.textContent = `${senha.numero} · ${senha.esteira_nome || '-'} · ${STATUS_LABEL[senha.status] || senha.status}`;
      ultimasChamadasLista.appendChild(li);
    });
  }

  async function chamarProximaSenha(esteiraId) {
    try {
      const fila = await Api.get('/senhas?status=AGUARDANDO');
      if (fila.length === 0) return;
      const proxima = fila[0];
      await Api.put(`/senhas/${proxima.id}/chamar`, { esteiraId });
    } catch (erro) {
      alert(`Não foi possível chamar a senha: ${erro.message}`);
      carregarTudo();
    }
  }

  async function repetirChamada(senhaId) {
    try {
      await Api.put(`/senhas/${senhaId}/repetir`);
    } catch (erro) {
      alert(`Não foi possível repetir a chamada: ${erro.message}`);
    }
  }

  async function finalizarAtendimento(senhaId) {
    try {
      await Api.put(`/senhas/${senhaId}/finalizar`);
    } catch (erro) {
      alert(`Não foi possível finalizar o atendimento: ${erro.message}`);
    }
  }

  async function cancelarSenha(senhaId) {
    if (!confirm('Cancelar esta senha?')) return;
    try {
      await Api.put(`/senhas/${senhaId}/cancelar`);
    } catch (erro) {
      alert(`Não foi possível cancelar a senha: ${erro.message}`);
    }
  }

  // --- Tempo real ---
  const socketUrl = window.AGUAFILA_SOCKET_URL || undefined;
  const socket = socketUrl ? io(socketUrl) : io();

  socket.on('connect', () => {
    statusConexao.classList.remove('desconectado');
    statusConexao.classList.add('conectado');
    statusConexaoTexto.textContent = 'Conectado';
    carregarTudo();
  });

  socket.on('disconnect', () => {
    statusConexao.classList.remove('conectado');
    statusConexao.classList.add('desconectado');
    statusConexaoTexto.textContent = 'Desconectado';
  });

  [
    'senha:criada',
    'senha:chamada',
    'senha:repetida',
    'senha:cancelada',
    'atendimento:finalizado',
    'esteira:liberada',
    'painel:atualizacao',
  ].forEach((evento) => socket.on(evento, carregarTudo));

  carregarTudo();
})();
