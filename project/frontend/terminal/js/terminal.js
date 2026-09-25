/**
 * Lógica do Terminal de Autoatendimento.
 * Fluxo (seção 6, etapas 2-4): pressiona "Retirar Senha" -> sistema gera,
 * salva e imprime a senha -> retorna para a tela inicial automaticamente.
 */
(() => {
  const TEMPO_EXIBICAO_SENHA_MS = 6000;

  const telaInicial = document.getElementById('tela-inicial');
  const telaSenha = document.getElementById('tela-senha');
  const telaErro = document.getElementById('tela-erro');

  const btnRetirar = document.getElementById('btn-retirar-senha');
  const btnRetirarPrioridade = document.getElementById('btn-retirar-senha-prioridade');
  const btnTentarNovamente = document.getElementById('btn-tentar-novamente');
  const elRelogio = document.getElementById('relogio');
  const elSenhaNumero = document.getElementById('terminal-senha-numero');
  const elSenhaStatus = document.getElementById('terminal-senha-status');
  const elErroMensagem = document.getElementById('terminal-erro-mensagem');

  const botoesSenha = [btnRetirar, btnRetirarPrioridade].filter(Boolean);
  let voltandoAoInicioTimer = null;

  function mostrar(tela) {
    [telaInicial, telaSenha, telaErro].forEach((el) => {
      const ativo = el === tela;
      el.hidden = !ativo;
      el.style.display = ativo ? (el === telaInicial ? 'flex' : 'block') : 'none';
      el.style.opacity = ativo ? '1' : '0';
      el.style.pointerEvents = ativo ? 'auto' : 'none';
    });
  }

  function atualizarRelogio() {
    const agora = new Date();
    elRelogio.textContent = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  function resetarBotao(botao) {
    if (!botao) return;
    const rotulo = botao.querySelector('.terminal__botao-rotulo');
    const textoOriginal = botao.dataset.textoOriginal || rotulo?.textContent || 'Retirar Senha';

    botao.disabled = false;
    botao.removeAttribute('aria-busy');
    if (rotulo) {
      rotulo.textContent = textoOriginal;
    }
  }

  function resetarBotoes() {
    botoesSenha.forEach((botao) => resetarBotao(botao));
  }

  async function retirarSenha(tipo = 'NORMAL') {
    const botao = tipo === 'PRIORIDADE' ? btnRetirarPrioridade : btnRetirar;
    const rotulo = botao?.querySelector('.terminal__botao-rotulo');
    const textoOriginal = botao?.dataset.textoOriginal || rotulo?.textContent || 'Retirar Senha';

    if (botao) {
      botao.dataset.textoOriginal = textoOriginal;
      botao.disabled = true;
      botao.setAttribute('aria-busy', 'true');
    }

    botoesSenha.forEach((outroBotao) => {
      if (outroBotao && outroBotao !== botao) {
        outroBotao.disabled = true;
        outroBotao.setAttribute('aria-busy', 'true');
      }
    });

    if (rotulo) {
      rotulo.textContent = tipo === 'PRIORIDADE' ? 'Gerando prioridade...' : 'Gerando senha...';
    }

    try {
      const resultado = await Api.post('/senhas', { tipo });
      const { senha, impressao } = resultado;

      elSenhaNumero.textContent = senha.numero;
      elSenhaStatus.textContent = impressao?.sucesso
        ? `Senha ${tipo === 'PRIORIDADE' ? 'prioritária' : 'normal'} gerada e impressa`
        : `Senha ${tipo === 'PRIORIDADE' ? 'prioritária' : 'normal'} gerada (verifique a impressora)`;

      mostrar(telaSenha);

      clearTimeout(voltandoAoInicioTimer);
      voltandoAoInicioTimer = setTimeout(() => {
        mostrar(telaInicial);
        resetarBotoes();
      }, TEMPO_EXIBICAO_SENHA_MS);
    } catch (erro) {
      elErroMensagem.textContent = erro.message || 'Verifique a conexão com o servidor local.';
      mostrar(telaErro);
      resetarBotao(botao);
      botoesSenha.forEach((outroBotao) => {
        if (outroBotao && outroBotao !== botao) {
          resetarBotao(outroBotao);
        }
      });
    }
  }

  btnRetirar.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    retirarSenha('NORMAL');
  });

  btnRetirarPrioridade?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    retirarSenha('PRIORIDADE');
  });

  btnTentarNovamente.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    mostrar(telaInicial);
    resetarBotoes();
  });

  function inicializarTerminal() {
    mostrar(telaInicial);
    resetarBotoes();
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000 * 30);
  inicializarTerminal();
})();
