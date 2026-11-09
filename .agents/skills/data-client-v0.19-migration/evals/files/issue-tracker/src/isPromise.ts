export function isPromise(value: unknown): value is Promise<unknown> {
  return typeof (value as { then?: unknown } | null)?.then === 'function';
}
