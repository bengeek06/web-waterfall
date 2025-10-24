/**
 * Enhanced Logger with beautiful colors for development and structured JSON for production
 *
 * In development mode:
 * - Uses colorized, human-readable output (no JSON) 
 * - Shows timestamps and beautiful colors for different log levels
 * - Compatible with Next.js 16 and Turbopack
 * 
 * In production mode:
 * - Uses structured JSON logging with Pino for better parsing
 * - Optimized for log aggregation systems
 * - Redacts sensitive information
 *
 * The logger's log level is determined by the `LOG_LEVEL` environment variable,
 * defaulting to `"info"` if not specified.
 */
import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const logLevel = process.env.LOG_LEVEL || "info";

// Couleurs ANSI pour le mode développement
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  
  // Couleurs de texte
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  
  // Couleurs de fond
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Configuration des niveaux et leurs couleurs
const levelConfig = {
  trace: { priority: 10, color: colors.gray, icon: '🔍', label: 'TRACE' },
  debug: { priority: 20, color: colors.green, icon: '🐛', label: 'DEBUG' },
  info: { priority: 30, color: colors.blue, icon: 'ℹ️', label: 'INFO' },
  warn: { priority: 40, color: colors.yellow, icon: '⚠️', label: 'WARN' },
  error: { priority: 50, color: colors.red, icon: '❌', label: 'ERROR' },
  fatal: { priority: 60, color: colors.bgRed, icon: '💀', label: 'FATAL' }
};

const currentLevelPriority = levelConfig[logLevel as keyof typeof levelConfig]?.priority || 30;

// Logger personnalisé pour le développement avec couleurs
class DevLogger {
  private formatTimestamp(): string {
    const now = new Date();
    return `${colors.gray}[${now.toLocaleTimeString()}]${colors.reset}`;
  }

  private formatLevel(level: keyof typeof levelConfig): string {
    const config = levelConfig[level];
    return `${config.color}${config.icon} ${config.label}${colors.reset}`;
  }

  private formatMessage(level: keyof typeof levelConfig, obj: any, msg?: string): string {
    const timestamp = this.formatTimestamp();
    const levelStr = this.formatLevel(level);
    
    if (typeof obj === 'string' && !msg) {
      // Simple string message
      return `${timestamp} ${levelStr}: ${obj}`;
    } else if (typeof obj === 'object' && msg) {
      // Object with message
      const objStr = JSON.stringify(obj, null, 2)
        .split('\n')
        .map((line, index) => index === 0 ? line : `  ${line}`)
        .join('\n');
      return `${timestamp} ${levelStr}: ${msg}\n${colors.cyan}${objStr}${colors.reset}`;
    } else {
      // Fallback
      const content = msg || JSON.stringify(obj, null, 2);
      return `${timestamp} ${levelStr}: ${content}`;
    }
  }

  private shouldLog(level: keyof typeof levelConfig): boolean {
    return levelConfig[level].priority >= currentLevelPriority;
  }

  trace(obj: any, msg?: string) {
    if (this.shouldLog('trace')) {
      console.log(this.formatMessage('trace', obj, msg));
    }
  }

  debug(obj: any, msg?: string) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', obj, msg));
    }
  }

  info(obj: any, msg?: string) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', obj, msg));
    }
  }

  warn(obj: any, msg?: string) {
    if (this.shouldLog('warn')) {
      console.log(this.formatMessage('warn', obj, msg));
    }
  }

  error(obj: any, msg?: string) {
    if (this.shouldLog('error')) {
      console.log(this.formatMessage('error', obj, msg));
    }
  }

  fatal(obj: any, msg?: string) {
    if (this.shouldLog('fatal')) {
      console.log(this.formatMessage('fatal', obj, msg));
    }
  }

  get level() {
    return logLevel;
  }

  set level(newLevel: string) {
    // Pour la compatibilité avec Pino
  }
}

// Logger pour la production avec Pino
const productionLogger = pino({
  level: logLevel,
  formatters: {
    level(label) {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ["password", "token", "authorization", "cookie", "auth", "secret"],
    censor: "[REDACTED]"
  }
});

// Exporter le logger approprié selon l'environnement
const logger = isDevelopment ? new DevLogger() : productionLogger;

// Message d'initialisation
logger.info(`🚀 Logger initialized with level: ${logLevel} (${isDevelopment ? 'development' : 'production'} mode)`);

export default logger;