const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'debug'];

function formatLog(level, message, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.debug) console.log(formatLog('DEBUG', message, context));
  },
  info(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.info) console.log(formatLog('INFO', message, context));
  },
  warn(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.warn) console.warn(formatLog('WARN', message, context));
  },
  error(message, context) {
    if (CURRENT_LEVEL <= LOG_LEVELS.error) console.error(formatLog('ERROR', message, context));
  },
};
