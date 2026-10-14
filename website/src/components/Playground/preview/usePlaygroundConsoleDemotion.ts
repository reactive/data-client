import { useEffect } from 'react';

/**
 * Playground console demotion — third-party noise only.
 *
 * When preview code throws, react-live's ErrorBoundary shows the error, and
 * React still logs it as a console.error. That is expected during demos, so it
 * is demoted to a warning. (Docusaurus creates the React root, so we can't pass
 * it an `onCaughtError` instead.)
 *
 * Do NOT add matchers for anything we control and should fix instead:
 * - `@data-client/*` packages
 * - First-party website / docs / demo code (non-package sources in this repo)
 *
 * If a playground surfaces a real library or site bug, fix the source — never
 * paper over it here.
 */

/** React's report of an error a preview's ErrorBoundary caught. → warn */
const DEMOTE_ERROR = /React will try to recreate this component tree/;

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
  if (DEMOTE_ERROR.test(message)) {
    console.warn(...args);
    return;
  }
  originalError?.apply(console, args);
}

/** Demote React's caught-error logs to warnings while previews are mounted. */
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
      if (refCount === 0 && originalError) {
        console.error = originalError;
        originalError = undefined;
      }
    };
  }, []);
}
