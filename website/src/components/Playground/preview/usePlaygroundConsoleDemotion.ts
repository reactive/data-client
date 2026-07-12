import { useEffect } from 'react';

/** React error-boundary console.error noise from live preview failures. */
const DEMOTE_ERROR = [
  /The above error occurred in the <[^>]+> component:/,
  /React will try to recreate this component tree/,
  /Error boundaries should implement getDerivedStateFromError\(\)/,
];

/** Exact React 19 development warning from classic JSX (react-live/sucrase). */
const DEMOTE_WARN = [
  /Your app \(or one of its dependencies\) is using an outdated JSX transform/,
];

let refCount = 0;
let originalError: typeof console.error | undefined;
let originalWarn: typeof console.warn | undefined;

/** Flatten console args the way React 19 may pass them (format string + Error). */
function consoleMessage(args: unknown[]): string {
  return args
    .map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

function shouldDemoteConsole(args: unknown[], patterns: RegExp[]): boolean {
  const message = consoleMessage(args);
  return Boolean(message) && patterns.some(pattern => pattern.test(message));
}

function demotedConsoleError(...args: unknown[]) {
  if (shouldDemoteConsole(args, DEMOTE_ERROR)) {
    console.warn(...args);
    return;
  }
  originalError?.apply(console, args);
}

function demotedConsoleWarn(...args: unknown[]) {
  if (shouldDemoteConsole(args, DEMOTE_WARN)) {
    return;
  }
  originalWarn?.apply(console, args);
}

/** Demote known react-live / React preview console noise while live previews are mounted. */
export function usePlaygroundConsoleDemotion() {
  useEffect(() => {
    if (typeof console === 'undefined') return;

    if (refCount === 0) {
      originalError = console.error;
      originalWarn = console.warn;
      console.error = demotedConsoleError as typeof console.error;
      console.warn = demotedConsoleWarn as typeof console.warn;
    }
    refCount += 1;

    return () => {
      refCount -= 1;
      if (refCount === 0) {
        if (originalError) {
          console.error = originalError;
          originalError = undefined;
        }
        if (originalWarn) {
          console.warn = originalWarn;
          originalWarn = undefined;
        }
      }
    };
  }, []);
}
