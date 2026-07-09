/**
 * Logger estruturado e leve, sem dependências externas.
 * Formato: [timestamp] [nível] mensagem { meta }
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function currentLevel() {
  const configured = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return LEVELS[configured] !== undefined ? LEVELS[configured] : LEVELS.info;
}

function format(level, message, meta) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta === undefined) return base;
  if (meta instanceof Error) {
    return `${base} :: ${meta.message}\n${meta.stack}`;
  }
  try {
    return `${base} :: ${JSON.stringify(meta)}`;
  } catch (_err) {
    return base;
  }
}

function log(level, message, meta) {
  if (LEVELS[level] > currentLevel()) return;
  const line = format(level, message, meta);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  error: (message, meta) => log('error', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  info: (message, meta) => log('info', message, meta),
  debug: (message, meta) => log('debug', message, meta),
};
