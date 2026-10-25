import { useController } from '@data-client/react';
import Translate from '@docusaurus/Translate';
import React, { useContext, useEffect } from 'react';
import { LiveContext } from 'react-live';

import { ResetIcon } from './ResetButton';
import { takeSnapshot, type PreviewSnapshot } from './usePreviewReset';
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
    onRenderError(code, takeSnapshot(controller));
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
    !isRenderError && splitError(error).name === 'SyntaxError' ?
      'compile'
    : 'runtime';
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
            <ResetIcon />{' '}
            <Translate id="playground.resetPreview">Reset preview</Translate>
          </button>
        : null
      }
    >
      <ErrorMessage error={error} />
    </ErrorPanel>
  );
}

/** Text content stays exactly `error`; the parts are only styled */
export function ErrorMessage({ error }: { error: string }) {
  const { name, message, location } = splitError(error);
  return (
    <pre className={styles.playgroundError}>
      {name ?
        <strong className={styles.errorName}>{name}</strong>
      : null}
      {message}
      {location ?
        <span className={styles.errorLocation}>{location}</span>
      : null}
    </pre>
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
