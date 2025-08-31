/**
 * A pre-configured Pino logger instance.
 *
 * The logger's log level is determined by the `LOG_LEVEL` environment variable,
 * defaulting to `"info"` if not specified.
 *
 * @see {@link https://getpino.io/#/|Pino documentation}
 */
import pino from "pino";

const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
        },
    },
  level: process.env.LOG_LEVEL || "info",
});

logger.info(`Logger initialized with level: ${logger.level}`);

export default logger;