const env = require('../config/env');
const { emitir, EVENTOS } = require('../realtime/socketManager');
const logger = require('../utils/logger');

/**
 * AudioService: responsável por construir e disparar o anúncio sonoro
 * de uma chamada (seção 12), totalmente desacoplado da regra de negócio.
 *
 * O SenhaService apenas invoca `anunciarChamada(senha, esteira)`.
 * Este service decide COMO o áudio é produzido:
 *
 *  - modo "tts": emite via Socket.IO um evento com o texto a ser lido;
 *    o cliente do Painel Público usa a Web Speech API (speechSynthesis)
 *    do navegador para sintetizar a voz localmente (sem internet).
 *
 *  - modo "arquivo": emite os identificadores dos trechos de áudio
 *    pré-gravados a serem concatenados pelo cliente
 *    (ex.: "senha", soletração do número, "dirija-se-a", "esteira", número).
 *
 * Trocar o modo é feito apenas via variável de ambiente AUDIO_MODE,
 * sem alterar SenhaService nem os controllers.
 */

function montarTexto(senha, esteira) {
  const numeroFalado = senha.numero.split('').join(' '); // ex: "A 0 2 3"
  return `Senha ${numeroFalado}, dirigir-se à ${esteira.nome}.`;
}

function montarSegmentosArquivo(senha, esteira) {
  return ['senha', ...senha.numero.split(''), 'dirigir-se-a', esteira.nome.toLowerCase().replace(' ', '-')];
}

function anunciarChamada(senha, esteira) {
  const payload = {
    modo: env.audio.mode,
    volume: env.audio.volume,
    texto: montarTexto(senha, esteira),
    segmentos: env.audio.mode === 'arquivo' ? montarSegmentosArquivo(senha, esteira) : undefined,
    senha: senha.numero,
    esteira: esteira.nome,
  };

  logger.info(`Anúncio de áudio (${env.audio.mode}): "${payload.texto}"`);
  emitir(EVENTOS.SENHA_CHAMADA, { tipo: 'audio', ...payload });
}

module.exports = { anunciarChamada };
