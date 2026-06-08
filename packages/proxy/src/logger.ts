import pino from "pino";

export const logger = pino(
  process.env["NODE_ENV"] === "production"
    ? {}
    : { transport: { target: "pino-pretty", options: { colorize: true } } },
);

export function createLogger(component: string) {
  return logger.child({ component });
}
