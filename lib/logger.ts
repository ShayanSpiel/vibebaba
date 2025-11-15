// lib/logger.ts
import { config, isProduction } from './config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  projectId?: string;
}

class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxStoredLogs = 1000;

  constructor() {
    this.minLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };
  }

  private write(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return;

    // Store in memory (circular buffer)
    this.logs.push(entry);
    if (this.logs.length > this.maxStoredLogs) {
      this.logs.shift();
    }

    // Console output with colors
    const levelStr = LogLevel[entry.level];
    const color = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m', // Green
      [LogLevel.WARN]: '\x1b[33m', // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    }[entry.level];
    const reset = '\x1b[0m';

    console.log(
      `${color}[${levelStr}]${reset} ${entry.timestamp} - ${entry.message}`,
      entry.context ? entry.context : '',
      entry.error ? entry.error : ''
    );

    // In production, send critical errors to monitoring service
    if (isProduction && entry.level === LogLevel.ERROR) {
      this.sendToMonitoring(entry).catch(console.error);
    }
  }

  private async sendToMonitoring(entry: LogEntry) {
    // TODO: Send to Sentry, LogRocket, or custom monitoring
    // For now, just store in PocketBase
    try {
      const { pb } = await import('./database/pocketbase');
      await pb
        .collection('error_logs')
        .create({
          level: LogLevel[entry.level],
          message: entry.message,
          context: entry.context,
          error: entry.error?.message,
          stack: entry.error?.stack,
          timestamp: entry.timestamp,
        })
        .catch(() => {
          // Silent fail if collection doesn't exist
        });
    } catch (error) {
      // Silent fail - don't crash app due to logging error
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.write(this.createEntry(LogLevel.DEBUG, message, context));
  }

  info(message: string, context?: Record<string, any>) {
    this.write(this.createEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.write(this.createEntry(LogLevel.WARN, message, context));
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.write(this.createEntry(LogLevel.ERROR, message, context, error));
  }

  // Get recent logs (for debugging UI)
  getRecentLogs(limit = 100, level?: LogLevel): LogEntry[] {
    const filtered =
      level !== undefined ? this.logs.filter((log) => log.level === level) : this.logs;
    return filtered.slice(-limit);
  }

  // Clear logs
  clear() {
    this.logs = [];
  }
}

// Export singleton
export const logger = new Logger();

// Convenience exports
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
};
