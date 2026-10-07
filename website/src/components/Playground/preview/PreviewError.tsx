import { useController, type State } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useEffect } from 'react';
import { LiveContext } from 'react-live';

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
    if (isRenderError) onRenderError(code, controller.getState());
  }, [isRenderError, code, onRenderError, controller]);
  // react-live commits a throwing render once before reporting its error, so
  // "healthy" means no error for a while.
  useEffect(() => {
    if (!isHealthy) return;
    const timer = setTimeout(onHealthy, HEALTHY_AFTER_MS);
    return () => clearTimeout(timer);
  }, [isHealthy, code, onHealthy]);

  if (!error) return null;
  return (
    <div className={styles.previewError}>
      <pre className={styles.playgroundError}>{error}</pre>
      {isRenderError ?
        <button type="button" onClick={onReset}>
          <ResetIcon /> Reset preview
        </button>
      : null}
    </div>
  );
}

const HEALTHY_AFTER_MS = 1000;

export interface PreviewErrorProps {
  onReset: () => void;
  /** Called with the code whose render threw and the store it threw with */
  onRenderError: (code: string, state: State<unknown>) => void;
  /** Called once the current code has rendered without error for a while */
  onHealthy: () => void;
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
