import CodeBlock from '@theme/CodeBlock';
import type React from 'react';

import DiffEditorChooser from './DiffEditorChooser';
import Grid from './Grid';
import { useCodeDocuments } from './Playground/editor/codeModel';

export default function DiffEditor({ children }: Props) {
  const { documents } = useCodeDocuments(children, 'Before');

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
  row?: boolean;
}
