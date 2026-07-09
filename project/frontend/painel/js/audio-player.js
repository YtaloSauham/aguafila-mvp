/**
 * AudioPlayer: reprodutor de áudio do Painel Público, desacoplado da
 * lógica de negócio (seção 12). Recebe um payload emitido pelo backend
 * (AudioService) e decide como reproduzir:
 *
 *  - modo "tts": usa a Web Speech API (speechSynthesis) do navegador,
 *    100% local, sem depender de internet.
 *  - modo "arquivo": toca uma sequência de arquivos .mp3 pré-gravados
 *    (/assets/audio/{segmento}.mp3), concatenados um após o outro.
 *
 * Navegadores bloqueiam áudio automático sem interação prévia do usuário;
 * por isso expomos `AudioPlayer.desbloquear()`, chamado no primeiro toque
 * na tela do painel.
 */
const AudioPlayer = (() => {
  let desbloqueado = false;

  function desbloquear() {
    if (desbloqueado) return;
    desbloqueado = true;
    // "Aquece" o motor de síntese de voz do navegador com uma fala silenciosa.
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance('');
      utter.volume = 0;
      window.speechSynthesis.speak(utter);
    }
  }

  function reproduzirTts(texto, volumePercentual) {
    if (!('speechSynthesis' in window)) {
      console.warn('Web Speech API indisponível neste navegador.');
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'pt-BR';
    utter.rate = 0.95;
    utter.volume = Math.min(Math.max((volumePercentual ?? 100) / 100, 0), 1);
    window.speechSynthesis.speak(utter);
  }

  function reproduzirArquivos(segmentos) {
    if (!segmentos || segmentos.length === 0) return;
    let indice = 0;

    function tocarProximo() {
      if (indice >= segmentos.length) return;
      const audio = new Audio(`/assets/audio/${segmentos[indice]}.mp3`);
      indice += 1;
      audio.addEventListener('ended', tocarProximo);
      audio.addEventListener('error', tocarProximo); // pula segmento ausente
      audio.play().catch(() => tocarProximo());
    }

    tocarProximo();
  }

  function reproduzir(payload) {
    if (!payload) return;
    if (payload.modo === 'arquivo') {
      reproduzirArquivos(payload.segmentos);
    } else {
      reproduzirTts(payload.texto, payload.volume);
    }
  }

  return { desbloquear, reproduzir };
})();
