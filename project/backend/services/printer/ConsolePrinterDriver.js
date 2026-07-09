const PrinterDriver = require('./PrinterDriver');
const logger = require('../../utils/logger');

/**
 * Driver de desenvolvimento/testes: "imprime" no console/log
 * em vez de enviar para uma impressora térmica física.
 *
 * Útil para rodar o MVP sem hardware conectado e serve como
 * referência de implementação para os drivers futuros
 * (ESC/POS, USB, Serial, Rede) mencionados na seção 13/17.
 */
class ConsolePrinterDriver extends PrinterDriver {
  async imprimir(senha) {
    const cupom = [
      '================================',
      '   COMPROVANTE DE SENHA',
      '================================',
      `Senha: ${senha.numero}`,
      `Data: ${senha.data}`,
      `Emitido em: ${new Date(senha.horaEmissao).toLocaleString('pt-BR')}`,
      '--------------------------------',
      'Aguarde ser chamado no painel.',
      '================================',
    ].join('\n');

    logger.info(`[IMPRESSORA:console] Imprimindo senha ${senha.numero}\n${cupom}`);
    return { sucesso: true, mensagem: 'Impresso via driver console (simulação).' };
  }
}

module.exports = ConsolePrinterDriver;
