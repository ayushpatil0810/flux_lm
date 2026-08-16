import pino from "pino";

/**
 * Structured application logger powered by pino.
 *
 * - Development: pretty-prints with timestamps and colors via `pino-pretty`.
 * - Production: emits compact JSON suitable for log aggregators (Datadog, Loki, etc.).
 *
 * Log level can be overridden via the `LOG_LEVEL` environment variable
 * (trace | debug | info | warn | error | fatal).
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("message");
 *   logger.error({ err }, "Something failed");
 *   const child = logger.child({ module: "SourceService" });
 */
const isDev = process.env.NODE_ENV === "development";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});
