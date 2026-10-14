import { useEffect } from 'react';

/**
 * Playground console demotion — third-party noise only.
 *
 * Live previews pull in packages we do not own (react-live, React's reaction to
 * react-live's ErrorBoundary). Those emit development
 * console noise that is expected during demos and is safe to demote/suppress.
 *
 * Do NOT add matchers for anything we control and should fix instead:
 * - `@data-client/*` packages
 * - First-party website / docs / demo code (non-package sources in this repo)
 *
 * If a playground surfaces a real library or site bug, fix the source — never
 * paper over it here.
 */

/** react-live / React ErrorBoundary follow-ups (not @data-client). → warn */
const DEMOTE_ERROR = [
  // React after a preview throw caught by react-live's ErrorBoundary
  /The above error occurred in the <[^>]+> component:/,
  /React will try to recreate this component tree/,
];

let refCount = 0;
let originalError: typeof console.error | undefined;

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

function demotedConsoleError(...args: unknown[]) {
  const message = consoleMessage(args);
  if (message && DEMOTE_ERROR.some(pattern => pattern.test(message))) {
    console.warn(...args);
    return;
  }
  originalError?.apply(console, args);
}

/** Demote third-party react-live / React preview console noise while previews are mounted. */
export function usePlaygroundConsoleDemotion() {
  useEffect(() => {
    if (typeof console === 'undefined') return;

    if (refCount === 0) {
      originalError = console.error;
      console.error = demotedConsoleError as typeof console.error;
    }
    refCount += 1;

    return () => {
      refCount -= 1;
      if (refCount === 0) {
        if (originalError) {
          console.error = originalError;
          originalError = undefined;
        }
      }
    };
  }, []);
}
