export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: string;
  durationMs?: number;
  metadata?: any;
}

export function logEvent(level: LogEntry['level'], event: string, durationMs?: number, metadata?: any) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    durationMs,
    metadata,
  };

  if (level === 'ERROR') {
    console.error(`[OBSERVABILITY ERROR] ${event}`, metadata || '');
  } else {
    console.log(`[OBSERVABILITY ${level}] ${event} ${durationMs ? `(${durationMs}ms)` : ''}`);
  }
}
