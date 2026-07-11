/**
 * Carrega e centraliza as variáveis de ambiente (.env).
 * Nenhuma outra parte do sistema deve ler process.env diretamente:
 * tudo passa por este módulo para facilitar manutenção e testes.
 */
require('dotenv').config();

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function toInt(value, defaultValue) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const env = {
  server: {
    port: toInt(process.env.PORT, 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: toInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aguafila_db',
    connectionLimit: toInt(process.env.DB_CONNECTION_LIMIT, 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  printer: {
    driver: process.env.PRINTER_DRIVER || 'escpos',
    port: process.env.PRINTER_PORT || '',
  },
  audio: {
    mode: process.env.AUDIO_MODE || 'tts',
    volume: toInt(process.env.AUDIO_VOLUME, 100),
  },
  business: {
    totalEsteiras: toInt(process.env.TOTAL_ESTEIRAS, 2),
    reinicioDiario: toBool(process.env.REINICIO_DIARIO, true),
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = env;
