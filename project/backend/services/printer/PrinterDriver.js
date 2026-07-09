/**
 * Interface abstrata de driver de impressão.
 *
 * Qualquer novo driver (ESC/POS, USB, Serial, Rede) deve implementar
 * o método `imprimir(senha)` seguindo este contrato, sem exigir
 * nenhuma alteração na regra de negócio (SenhaService) ou no PrinterService.
 *
 * Isso satisfaz a seção 13 da especificação: impressão via interface
 * abstrata, sem dependência de fabricante específico.
 */
class PrinterDriver {
  /**
   * @param {{numero: string, data: string, horaEmissao: Date}} senha
   * @returns {Promise<{sucesso: boolean, mensagem: string}>}
   */
  // eslint-disable-next-line no-unused-vars
  async imprimir(senha) {
    throw new Error('O método imprimir() deve ser implementado pelo driver concreto.');
  }
}

module.exports = PrinterDriver;
