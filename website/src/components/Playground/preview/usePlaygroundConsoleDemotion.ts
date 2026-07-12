import { useEffect } from 'react';

const REACT_BOUNDARY_ERROR =
  /The above error occurred in the <\w+> component:|React will try to recreate this component tree from scratch using the error boundary you provided/i;

let refCount = 0;
let originalError: typeof console.error | undefined;

function demotedConsoleError(...args: unknown[]) {
  const first = args[0];
  const message =
    typeof first === 'string' ? first
    : first instanceof Error ? first.message
    : '';
  if (message && REACT_BOUNDARY_ERROR.test(message)) {
    console.warn(...args);
    return;
  }
  originalError?.apply(console, args);
}

/** Demote React error-boundary console.error noise while live previews are mounted. */
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
