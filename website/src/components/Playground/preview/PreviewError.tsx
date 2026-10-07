import { useController } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useEffect } from 'react';
import { LiveContext } from 'react-live';

import type { PreviewSnapshot } from './usePreviewReset';
import ErrorPanel from '../ErrorPanel';
import styles from '../styles.module.css';

/** react-live's error, plus a reset when it came from rendering (a fresh store may fix it).
 *
 * react-live sets `newCode` only once code reaches render, so compile and
 * evaluation errors leave it at older code.
 */
export default function PreviewError({
  onReset,
  onRenderError,
  onHealthy,
}: PreviewErrorProps) {
  const { error, code, newCode } = useContext(LiveContext);
  const controller = useController();
  const rendered = newCode === code;
  const isRenderError = !!error && rendered;
  const isHealthy = !error && rendered;

  useEffect(() => {
    if (!isRenderError) return;
    onRenderError(code, {
      // The old store's in-flight requests die with it, so drop their optimistic updates
      state: { ...controller.getState(), optimistic: [] },
      // MockResolver's controller holds the simulated server's data
      interceptorData: (controller as { interceptorData?: unknown })
        .interceptorData,
    });
  }, [isRenderError, code, onRenderError, controller]);
  // react-live commits a throwing render once before reporting its error, so
  // "healthy" means no error for a while.
  useEffect(() => {
    if (!isHealthy) return;
    const timer = setTimeout(() => onHealthy(code), HEALTHY_AFTER_MS);
    return () => clearTimeout(timer);
  }, [isHealthy, code, onHealthy]);

  if (!error) return null;
  const { name, message, location } = splitError(error);
  // react-live reports transform failures (and a missing `render()`) as SyntaxErrors
  const kind = !isRenderError && name === 'SyntaxError' ? 'compile' : 'runtime';
  return (
    <ErrorPanel
      kind={kind}
      action={
        isRenderError ?
          <button
            type="button"
            className={styles.errorAction}
            onClick={onReset}
          >
            <ResetIcon /> Reset preview
          </button>
        : null
      }
    >
      {/* Text content stays exactly `error`; the parts are only styled */}
      <pre className={styles.playgroundError}>
        {name ?
          <strong className={styles.errorName}>{name}</strong>
        : null}
        {message}
        {location ?
          <span className={styles.errorLocation}>{location}</span>
        : null}
      </pre>
    </ErrorPanel>
  );
}

const HEALTHY_AFTER_MS = 1000;

export interface PreviewErrorProps {
  onReset: () => void;
  /** Called with the code whose render threw and the preview it threw in */
  onRenderError: (code: string, snapshot: PreviewSnapshot) => void;
  /** Called once the current code has rendered without error for a while */
  onHealthy: (code: string) => void;
}

/** "TypeError: msg (3:12)" → name "TypeError", message ": msg ", location "(3:12)" */
function splitError(error: string) {
  const named = /^((?:[A-Z][A-Za-z]*)?Error)((?::[\s\S]*)?)$/.exec(error);
  let name = '';
  let message = error;
  if (named) {
    name = named[1];
    message = named[2];
  }
  let location = '';
  // sucrase appends the position in the concatenated document
  const located = /^([\s\S]*?\s)(\(\d+:\d+\))$/.exec(message);
  if (located) {
    message = located[1];
    location = located[2];
  }
  return { name, message, location };
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.resetButton)}
      title="Reset preview"
      aria-label="Reset preview"
      onClick={onClick}
    >
      <ResetIcon />
    </button>
  );
}

function ResetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8.3" />
      <path d="M3 3v5.3h5.3" />
    </svg>
  );
}
