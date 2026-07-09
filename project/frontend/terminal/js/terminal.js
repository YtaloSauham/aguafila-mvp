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
  const btnTentarNovamente = document.getElementById('btn-tentar-novamente');
  const elRelogio = document.getElementById('relogio');
  const elSenhaNumero = document.getElementById('terminal-senha-numero');
  const elSenhaStatus = document.getElementById('terminal-senha-status');
  const elErroMensagem = document.getElementById('terminal-erro-mensagem');

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

  async function retirarSenha() {
    const rotulo = btnRetirar.querySelector('.terminal__botao-rotulo');
    const textoOriginal = rotulo?.textContent || 'Retirar Senha';

    btnRetirar.disabled = true;
    btnRetirar.setAttribute('aria-busy', 'true');
    if (rotulo) {
      rotulo.textContent = 'Gerando senha...';
    }

    try {
      const resultado = await Api.post('/senhas');
      const { senha, impressao } = resultado;

      elSenhaNumero.textContent = senha.numero;
      elSenhaStatus.textContent = impressao?.sucesso
        ? 'Senha gerada e impressa'
        : 'Senha gerada (verifique a impressora)';

      mostrar(telaSenha);

      clearTimeout(voltandoAoInicioTimer);
      voltandoAoInicioTimer = setTimeout(() => {
        mostrar(telaInicial);
        btnRetirar.disabled = false;
        btnRetirar.removeAttribute('aria-busy');
        if (rotulo) {
          rotulo.textContent = textoOriginal;
        }
      }, TEMPO_EXIBICAO_SENHA_MS);
    } catch (erro) {
      elErroMensagem.textContent = erro.message || 'Verifique a conexão com o servidor local.';
      mostrar(telaErro);
      btnRetirar.disabled = false;
      btnRetirar.removeAttribute('aria-busy');
      if (rotulo) {
        rotulo.textContent = textoOriginal;
      }
    }
  }

  btnRetirar.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    retirarSenha();
  });

  btnTentarNovamente.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    mostrar(telaInicial);
    btnRetirar.disabled = false;
    if (btnRetirar.querySelector('.terminal__botao-rotulo')) {
      btnRetirar.querySelector('.terminal__botao-rotulo').textContent = 'Retirar Senha';
    }
  });

  function inicializarTerminal() {
    mostrar(telaInicial);
    btnRetirar.disabled = false;
    if (btnRetirar.querySelector('.terminal__botao-rotulo')) {
      btnRetirar.querySelector('.terminal__botao-rotulo').textContent = 'Retirar Senha';
    }
  }

  atualizarRelogio();
  setInterval(atualizarRelogio, 1000 * 30);
  inicializarTerminal();
})();
