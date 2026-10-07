import { useController } from '@data-client/react';
import clsx from 'clsx';
import React, { useContext, useEffect, type ReactNode } from 'react';
import { LiveContext } from 'react-live';

import type { PreviewSnapshot } from './usePreviewReset';
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
  // react-live reports transform failures (and a missing `render()`) as SyntaxErrors
  const kind =
    !isRenderError && error.startsWith('SyntaxError') ? 'compile' : 'runtime';
  const { name, message, location } = splitError(error);
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
  const named = /^((?:[A-Z][A-Za-z]*)?Error)(:[\s\S]*)?$/.exec(error);
  let name = '';
  let message = error;
  if (named) {
    name = named[1];
    message = named[2] ?? '';
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

export type ErrorKind = 'compile' | 'runtime' | 'network';

const LABELS: Record<ErrorKind, string> = {
  compile: 'Compile error',
  runtime: 'Runtime error',
  network: 'Network error',
};

/** Card framing a preview failure: what stage failed (compile, runtime, network) and the message */
export function ErrorPanel({
  kind,
  children,
  action,
}: {
  kind: ErrorKind;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.previewError} data-kind={kind}>
      <div className={styles.errorKind}>
        <KindIcon kind={kind} />
        {LABELS[kind]}
      </div>
      {children}
      {action}
    </div>
  );
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

/** compile: warning triangle; runtime: octagon with ×; network: broken link */
function KindIcon({ kind }: { kind: ErrorKind }) {
  return (
    <svg
      className={styles.errorIcon}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {kind === 'compile' ?
        <>
          <path d="M12 3.5 2.5 20h19L12 3.5Z" />
          <path d="M12 10v4.5" />
          <path d="M12 17.5h.01" />
        </>
      : kind === 'runtime' ?
        <>
          <path d="M8 2.5h8l5.5 5.5v8L16 21.5H8L2.5 16V8L8 2.5Z" />
          <path d="m9 9 6 6M15 9l-6 6" />
        </>
      : <>
          <path d="M10.5 13.5a4 4 0 0 0 5.66 0l2.84-2.84a4 4 0 0 0-5.66-5.66L12 6.34" />
          <path d="M13.5 10.5a4 4 0 0 0-5.66 0L5 13.34A4 4 0 0 0 10.66 19L12 17.66" />
          <path d="M4 4l16 16" />
        </>
      }
    </svg>
  );
}
