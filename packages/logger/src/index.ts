/**
 * Logger package for CRM
 * Provides structured logging with request context support
 */

// Log levels
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

// Log context
export interface LogContext {
  [key: string]: unknown;
}

// Logger interface
export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(
    message: string | Error | LogContext,
    error?: Error | LogContext,
    context?: LogContext,
  ): void;
  fatal(
    message: string | Error | LogContext,
    error?: Error | LogContext,
    context?: LogContext,
  ): void;
  child(boundContext: LogContext): Logger;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Environment
const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";
const logLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

// Log level priorities
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (isTest) return false; // Suppress logs in tests
  return LOG_LEVELS[level] >= LOG_LEVELS[logLevel];
}

/**
 * Format log entry
 */
function formatLogEntry(entry: LogEntry): string {
  if (isDevelopment) {
    // Pretty format for development
    const parts = [
      `[${entry.timestamp}]`,
      entry.level.toUpperCase().padEnd(5),
      entry.message,
    ];

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context, null, 2));
    }

    if (entry.error) {
      parts.push(`\nError: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(`\n${entry.error.stack}`);
      }
    }

    return parts.join(" ");
  }

  // JSON format for production
  return JSON.stringify(entry);
}

/**
 * Create log entry and output
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error,
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case "debug":
    case "info":
      console.log(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "error":
    case "fatal":
      console.error(output);
      break;
  }
}

/**
 * Base logger implementation
 */
class BaseLogger implements Logger {
  protected boundContext?: LogContext;

  constructor(boundContext?: LogContext) {
    this.boundContext = boundContext;
  }

  debug(message: string, context?: LogContext): void {
    log("debug", message, { ...this.boundContext, ...context });
  }

  info(message: string, context?: LogContext): void {
    log("info", message, { ...this.boundContext, ...context });
  }

  warn(message: string, context?: LogContext): void {
    log("warn", message, { ...this.boundContext, ...context });
  }

  error(
    message: string | Error | LogContext,
    error?: Error | LogContext,
    context?: LogContext,
  ): void {
    // Handle different call signatures
    if (message instanceof Error) {
      log(
        "error",
        message.message,
        { ...this.boundContext, ...context },
        message,
      );
    } else if (error instanceof Error) {
      log(
        "error",
        typeof message === "string" ? message : "Error",
        {
          ...this.boundContext,
          ...(typeof message === "object" ? message : {}),
          ...(typeof error === "object" && !(error instanceof Error)
            ? error
            : {}),
          ...context,
        },
        error,
      );
    } else {
      const msg = typeof message === "string" ? message : "Error";
      const ctx =
        typeof message === "object"
          ? message
          : { ...this.boundContext, ...error, ...context };
      log("error", msg, ctx);
    }
  }

  fatal(
    message: string | Error | LogContext,
    error?: Error | LogContext,
    context?: LogContext,
  ): void {
    // Handle different call signatures
    if (message instanceof Error) {
      log(
        "fatal",
        message.message,
        { ...this.boundContext, ...context },
        message,
      );
    } else if (error instanceof Error) {
      log(
        "fatal",
        typeof message === "string" ? message : "Fatal Error",
        {
          ...this.boundContext,
          ...(typeof message === "object" ? message : {}),
          ...(typeof error === "object" && !(error instanceof Error)
            ? error
            : {}),
          ...context,
        },
        error,
      );
    } else {
      const msg = typeof message === "string" ? message : "Fatal Error";
      const ctx =
        typeof message === "object"
          ? message
          : { ...this.boundContext, ...error, ...context };
      log("fatal", msg, ctx);
    }
  }

  child(boundContext: LogContext): Logger {
    return new BaseLogger({ ...this.boundContext, ...boundContext });
  }
}

/**
 * Default logger instance
 */
export const logger: Logger = new BaseLogger();

/**
 * Create a request-scoped logger
 * Extracts request metadata and creates a child logger
 */
export function createRequestLogger(request: Request): Logger {
  const url = new URL(request.url);
  const requestContext: LogContext = {
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    userAgent: request.headers.get("user-agent"),
    ip:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip"),
  };

  return logger.child(requestContext);
}
