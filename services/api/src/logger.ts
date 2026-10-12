/**
 * Minimaler strukturierter Logger.
 * Dokumentinhalte und Geheimnisse werden nie protokolliert: Felder mit sensiblen Namen
 * werden vor der Ausgabe ersetzt, lange Zeichenketten gekürzt.
 */

const SENSITIVE_KEYS =
  /(authorization|token|secret|password|api[_-]?key|cookie|content|body|text|values|file)/i;
const MAX_STRING = 200;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[…]';
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}… [gekürzt]` : value;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = SENSITIVE_KEYS.test(key) ? '[entfernt]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

type Level = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  log(level: Level, message: string, meta?: Record<string, unknown>): void;
}

export const consoleLogger: Logger = {
  log(level, message, meta) {
    const line = JSON.stringify({
      level,
      message,
      time: new Date().toISOString(),
      ...(meta ? { meta: redact(meta) } : {}),
    });
    if (level === 'error' || level === 'warn') console.error(line);
    else process.stdout.write(`${line}\n`);
  },
};

export const silentLogger: Logger = { log() {} };
