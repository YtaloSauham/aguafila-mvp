const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const PrinterDriver = require('./PrinterDriver');

/**
 * Driver ESC/POS para impressoras térmicas físicas usando node-thermal-printer.
 * O fluxo de emissão de senhas já chama este driver automaticamente ao clicar
 * em "Retirar senha", então basta configurar a impressora e o endpoint.
 */
class EscPosPrinterDriver extends PrinterDriver {
  constructor({ port }) {
    super();
    this.port = port || 'tcp://localhost:9100';
  }

  async imprimir(senha) {
    const horaEmissao = senha.horaEmissao || senha.hora_emissao;
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: this.port,
      characterSet: CharacterSet.PC1252,
      removeSpecialCharacters: false,
      options: {
        timeout: 3000,
      },
    });

    try {
      await printer.isPrinterConnected();

      printer.alignCenter();
      printer.bold(true);
      printer.println('COMPROVANTE DE SENHA');
      printer.bold(false);
      printer.newLine();

      printer.alignLeft();
      printer.println(`Senha: ${senha.numero}`);
      printer.println(`Data: ${senha.data}`);
      printer.println(`Emitido em: ${new Date(horaEmissao).toLocaleString('pt-BR')}`);
      printer.newLine();
      printer.println('Aguarde ser chamado no painel.');
      printer.newLine();
      printer.cut();

      await printer.execute();
      return { sucesso: true, mensagem: `Impressão enviada para ${this.port}.` };
    } catch (error) {
      throw new Error(`Falha ao imprimir via node-thermal-printer: ${error.message}`);
    }
  }
}

module.exports = EscPosPrinterDriver;
