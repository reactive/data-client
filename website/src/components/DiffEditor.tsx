import CodeBlock from '@theme/CodeBlock';

import DiffEditorChooser from './DiffEditorChooser';
import Grid from './Grid';
import { useCode } from './Playground/useCode';

export default function DiffEditor({ children, row }) {
  const { handleCodeChange, codes, codeTabs } = useCode(children, 'Before');

  const fallback = (
    <Grid wrap>
      <CodeBlock language={codeTabs[0].language} title="Before">
        {codes[0]}
      </CodeBlock>
      <CodeBlock language={codeTabs[1].language} title="After">
        {codes[1]}
      </CodeBlock>
    </Grid>
  );

  return (
    <DiffEditorChooser codes={codes} codeTabs={codeTabs} fallback={fallback} />
  );
}
