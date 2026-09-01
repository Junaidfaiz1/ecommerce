type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    service: 'vorqen',
    ...sanitize(context),
    ts: new Date().toISOString(),
  };

  const line = JSON.stringify(entry);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else if (level === 'debug' && process.env.NODE_ENV === 'development') {
    console.debug(line);
  } else if (level === 'info') {
    console.info(line);
  }
}

const SENSITIVE = /password|token|secret|authorization|cookie|card/i;

function sanitize(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    out[key] = SENSITIVE.test(key) ? '[redacted]' : value;
  }
  return out;
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
};
