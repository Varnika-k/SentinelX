/**
 * Structured Logger for SentinelX
 * Provides consistent logging across the platform with severity levels.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel = 'info';
  private isServer = typeof window === 'undefined';

  constructor() {
    // In production we might want to default to 'info'
    const safeEnv = typeof process !== 'undefined' && typeof process.env !== 'undefined' ? process.env : {} as Record<string, string>;
    if (safeEnv.LOG_LEVEL) {
      this.level = safeEnv.LOG_LEVEL as LogLevel;
    }
  }

  private shouldLog(lvl: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(lvl) >= levels.indexOf(this.level);
  }

  private format(lvl: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [SENTINELX] [${lvl.toUpperCase()}]`;
    
    if (data) {
      let serializedData: string;
      try {
        if (data instanceof Error) {
          serializedData = JSON.stringify({
            message: data.message,
            stack: data.stack,
            name: data.name
          });
        } else if (typeof data === 'object') {
          // Handle cases where data might contain Error objects inside it
          serializedData = JSON.stringify(data, (key, value) => {
            if (value instanceof Error) {
              return {
                message: value.message,
                stack: value.stack,
                name: value.name
              };
            }
            return value;
          });
        } else {
          serializedData = String(data);
        }
      } catch (e) {
        serializedData = '[Serialization Error]';
      }
      return `${prefix} ${message} | Data: ${serializedData}`;
    }
    return `${prefix} ${message}`;
  }

  public debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message, data));
    }
  }

  public info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(this.format('info', message, data));
    }
  }

  public warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, data));
    }
  }

  public error(message: string, data?: any) {
    if (this.shouldLog('error')) {
      console.error(this.format('error', message, data));
    }
  }
}

export const logger = new Logger();
