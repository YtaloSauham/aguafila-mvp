const PrinterDriver = require('./PrinterDriver');

/**
 * Esqueleto de driver ESC/POS para impressoras térmicas físicas
 * (USB, Serial ou Rede). Não implementado no MVP por falta de hardware
 * no ambiente de desenvolvimento — serve como ponto de extensão futuro
 * (seção 17 da especificação).
 *
 * Para ativar: implemente os métodos abaixo utilizando uma biblioteca
 * ESC/POS (ex.: node-thermal-printer, escpos) e troque
 * PRINTER_DRIVER=escpos no .env. Nenhuma outra camada do sistema
 * precisa ser alterada.
 */
class EscPosPrinterDriver extends PrinterDriver {
  constructor({ port }) {
    super();
    this.port = port;
  }

  async imprimir(_senha) {
    throw new Error(
      'Driver ESC/POS ainda não implementado. Configure PRINTER_DRIVER=console ' +
      'para desenvolvimento ou implemente este driver para o hardware desejado.'
    );
  }
}

module.exports = EscPosPrinterDriver;
