import CodeBlock from '@theme/CodeBlock';
import React, { useMemo } from 'react';

import DiffEditorChooser from './DiffEditorChooser';
import Grid from './Grid';
import { parseCodeDocuments } from './Playground/editor/codeModel';

export default function DiffEditor({ children }: Props) {
  // Display-only: documents never change after parsing
  const documents = useMemo(
    () => parseCodeDocuments(children, 'Before'),
    [children],
  );

  const fallback = (
    <Grid wrap>
      <CodeBlock language={documents[0].language} title="Before">
        {documents[0].value}
      </CodeBlock>
      <CodeBlock language={documents[1].language} title="After">
        {documents[1].value}
      </CodeBlock>
    </Grid>
  );

  return <DiffEditorChooser documents={documents} fallback={fallback} />;
}

interface Props {
  children: React.ReactNode;
}
