import CodeBlock from '@theme/CodeBlock';
import React, { useMemo } from 'react';

import styles from './DiffEditor.module.css';
import DiffEditorChooser from './DiffEditorChooser';
import Grid from './Grid';
import { calloutMarker, parseCallouts } from './Playground/editor/callouts';
import { parseCodeDocuments } from './Playground/editor/codeModel';

export default function DiffEditor({ children, caption }: Props) {
  // Display-only: documents never change after parsing
  const { sides, callouts } = useMemo(() => {
    const [before, after] = parseCodeDocuments(children, 'Before');
    const original = parseCallouts(before.value);
    const modified = parseCallouts(after.value, original.callouts.length);
    return {
      sides: [
        {
          ...original,
          language: before.language,
          title: before.title || 'Before',
        },
        {
          ...modified,
          language: after.language,
          title: after.title || 'After',
        },
      ] as const,
      callouts: [...original.callouts, ...modified.callouts],
    };
  }, [children]);

  const fallback = (
    <Grid wrap>
      {sides.map(({ language, title, staticValue }, i) => (
        <CodeBlock key={i} language={language} title={title}>
          {staticValue}
        </CodeBlock>
      ))}
    </Grid>
  );

  // Caption and callouts render outside the editor so they are always in the
  // server-rendered HTML, whether or not Monaco loads.
  return (
    <figure className={styles.figure}>
      {caption && (
        <figcaption className={styles.caption}>
          {typeof caption === 'string' ? inlineCode(caption) : caption}
        </figcaption>
      )}
      <DiffEditorChooser sides={sides} fallback={fallback} />
      {callouts.length > 0 && (
        <ol className={styles.callouts}>
          {callouts.map(({ index, text }) => (
            <li key={index}>
              <span className={styles.marker}>{calloutMarker(index)}</span>
              <span>{inlineCode(text)}</span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}

/** `backticked` spans become <code>, so callouts can name identifiers */
function inlineCode(text: string) {
  return text
    .split('`')
    .map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}

interface Props {
  children: React.ReactNode;
  /** One line on why this change is needed, shown above the diff */
  caption?: React.ReactNode;
}
