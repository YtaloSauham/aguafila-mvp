const env = require('../config/env');
const logger = require('../utils/logger');
const ConsolePrinterDriver = require('./printer/ConsolePrinterDriver');
const EscPosPrinterDriver = require('./printer/EscPosPrinterDriver');

/**
 * PrinterService: ponto único de acesso à impressão no sistema.
 *
 * Desacoplado do fabricante/driver concreto (seção 13). O driver ativo
 * é escolhido por configuração (PRINTER_DRIVER), permitindo trocar de
 * impressora sem alterar SenhaService ou qualquer regra de negócio.
 */
function criarDriver() {
  switch (env.printer.driver) {
    case 'console':
      return new ConsolePrinterDriver();
    case 'escpos':
    case 'usb':
    case 'serial':
    case 'rede':
      return new EscPosPrinterDriver({ port: env.printer.port });
    default:
      logger.warn(`Driver de impressora desconhecido "${env.printer.driver}", usando console.`);
      return new ConsolePrinterDriver();
  }
}

const driver = criarDriver();

/**
 * Imprime o comprovante da senha. Falhas de impressão NÃO devem
 * impedir a emissão da senha (a senha já está salva no banco);
 * o erro é registrado em log para ação do operador/suporte.
 */
async function imprimirSenha(senha) {
  try {
    const resultado = await driver.imprimir(senha);
    return resultado;
  } catch (error) {
    logger.error(`Falha ao imprimir senha ${senha.numero}.`, error);
    return { sucesso: false, mensagem: error.message };
  }
}

module.exports = { imprimirSenha };
