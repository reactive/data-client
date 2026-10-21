import { useCodeBlockContext } from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/CodeBlock/Title';
import React from 'react';

import { SHELLS } from '../shells';
import styles from './styles.module.css';

/** A shell block's title reads as a terminal's, with its icon */
export default function CodeBlockTitle({ children }: Props) {
  const { metadata } = useCodeBlockContext();
  if (!SHELLS.has(metadata.language)) return children;
  return (
    <span className={styles.terminalTitle}>
      <TerminalIcon />
      {children}
    </span>
  );
}

// Lucide icon (ISC): terminal
function TerminalIcon() {
  return (
    <svg
      className={styles.terminalIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 19h8" />
      <path d="m4 17 6-6-6-6" />
    </svg>
  );
}
