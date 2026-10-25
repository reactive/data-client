import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import React from 'react';

import styles from '../styles.module.css';

/** The preview header's reset; without `onClick` (the preview still
 * loading) it holds its place, disabled */
export default function ResetButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      className={clsx('clean-btn', styles.headerButton, styles.resetButton)}
      title={resetLabel()}
      aria-label={resetLabel()}
      onClick={onClick}
      disabled={!onClick}
    >
      <ResetIcon />
    </button>
  );
}

const resetLabel = () =>
  translate({ id: 'playground.resetPreview', message: 'Reset preview' });

export function ResetIcon() {
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
