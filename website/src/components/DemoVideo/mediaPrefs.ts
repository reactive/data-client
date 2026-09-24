interface NavigatorConnection {
  saveData?: boolean;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function prefersReducedData(): boolean {
  if (typeof navigator === 'object') {
    const connection = (
      navigator as Navigator & { connection?: NavigatorConnection }
    ).connection;
    if (connection?.saveData) return true;
  }
  return (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-data: reduce)').matches
  );
}
