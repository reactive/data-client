declare module '@sentry/react' {
  export function init(options: Record<string, unknown>): void;
  export function globalHandlersIntegration(): unknown;
  export function captureException(error: unknown, context?: unknown): void;
}
