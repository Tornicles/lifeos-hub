/**
 * Structured logging utility for LifeOS
 * Provides consistent log format across the application
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  userId?: string;
  tenantId?: string;
  action?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private service: string;
  private enableDebug: boolean;

  constructor(service: string) {
    this.service = service;
    this.enableDebug = import.meta.env.DEV || import.meta.env.VITE_LOG_LEVEL === 'DEBUG';
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      ...metadata
    };

    // In development, pretty print to console
    if (import.meta.env.DEV) {
      const color = {
        DEBUG: '\x1b[36m', // cyan
        INFO: '\x1b[32m',  // green
        WARN: '\x1b[33m',  // yellow
        ERROR: '\x1b[31m', // red
        CRITICAL: '\x1b[41m' // red background
      }[level];

      console.log(
        `${color}[${level}]\x1b[0m ${entry.timestamp} [${this.service}] ${message}`,
        metadata || ''
      );
    } else {
      // In production, output JSON for log aggregation
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    if (this.enableDebug) {
      this.log('DEBUG', message, metadata);
    }
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('INFO', message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('WARN', message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('ERROR', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  critical(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log('CRITICAL', message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  /**
   * Time an async operation and log the duration
   */
  async timeAsync<T>(
    action: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.info(`${action} completed`, { ...metadata, duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${action} failed`, error as Error, { ...metadata, duration_ms: duration });
      throw error;
    }
  }
}

/**
 * Create a logger instance for a specific service/component
 */
export function createLogger(service: string): Logger {
  return new Logger(service);
}

// Export convenience loggers for common use cases
export const apiLogger = createLogger('API');
export const dbLogger = createLogger('Database');
export const authLogger = createLogger('Auth');
export const automationLogger = createLogger('Automation');
