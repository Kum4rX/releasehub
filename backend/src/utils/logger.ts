type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class Logger {
  private static format(level: LogLevel, message: string, ...meta: unknown[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  static info(message: string, ...meta: unknown[]): void {
    console.log(this.format('info', message), ...meta);
  }

  static warn(message: string, ...meta: unknown[]): void {
    console.warn(this.format('warn', message), ...meta);
  }

  static error(message: string, ...meta: unknown[]): void {
    console.error(this.format('error', message), ...meta);
  }

  static debug(message: string, ...meta: unknown[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('debug', message), ...meta);
    }
  }
}
