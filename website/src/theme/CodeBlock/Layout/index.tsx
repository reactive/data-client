import { translate } from '@docusaurus/Translate';
import {
  CodeBlockContextProvider,
  useCodeBlockContext,
} from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/CodeBlock/Layout';
import Layout from '@theme-original/CodeBlock/Layout';
import clsx from 'clsx';
import React, { useMemo } from 'react';

import styles from './styles.module.css';
import useTapped from '../../../components/useTapped';
import { SHELLS } from '../shells';

/** Shell blocks say they go in a terminal: a `$` before each command, which
 * isn't copied, and a tooltip saying so (agent prompts: theme/CodeBlock) */
export default function LayoutWrapper(props: Props) {
  const { metadata, wordWrap } = useCodeBlockContext();
  const [tapped, tap] = useTapped();
  const shell = SHELLS.has(metadata.language);
  const shellMetadata = useMemo(() => {
    if (!shell) return metadata;
    const lineClassNames = { ...metadata.lineClassNames };
    metadata.code.split('\n').forEach((line, i, lines) => {
      // not comments, blank lines, or the rest of a command continued with `\`
      if (!line.trim() || /^\s*#/.test(line) || /\\$/.test(lines[i - 1] ?? ''))
        return;
      lineClassNames[i] = [...(lineClassNames[i] ?? []), styles.command];
    });
    return { ...metadata, lineClassNames };
  }, [shell, metadata]);
  if (!shell) return <Layout {...props} />;

  return (
    <div
      className={clsx(styles.terminal, tapped && styles.tapped)}
      // touch screens can't hover: a tap shows the tooltip for a moment instead
      onPointerUp={e => e.pointerType === 'touch' && tap()}
    >
      <CodeBlockContextProvider metadata={shellMetadata} wordWrap={wordWrap}>
        <Layout {...props} />
      </CodeBlockContextProvider>
      <span role="tooltip" className={styles.tip}>
        {translate({
          id: 'theme.CodeBlock.terminal',
          message: 'Run in your terminal',
          description:
            'Tooltip of code blocks holding shell commands, which start with $',
        })}
      </span>
    </div>
  );
}
