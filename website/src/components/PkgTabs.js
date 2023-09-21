import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

export default function PkgTabs({ pkgs, dev = false }) {
  return (
    <Tabs
      defaultValue="npm"
      groupId="node-packages-program"
      values={[
        { label: 'NPM', value: 'npm' },
        { label: 'Yarn', value: 'yarn' },
        { label: 'esm.sh', value: 'esm' },
      ]}
    >
      <TabItem value="yarn">
        <CodeBlock className="language-bash">
          yarn add {dev ? '--dev ' : ''}
          {pkgs}
        </CodeBlock>
      </TabItem>
      <TabItem value="npm">
        <CodeBlock className="language-bash">
          npm install --save{dev ? 'Dev ' : ''} {pkgs}
        </CodeBlock>
      </TabItem>
      <TabItem value="esm">
        <CodeBlock className="language-html">
          {`<script type="module">
${pkgs
  .split(' ')
  .map(pkg => `  import * from 'https://esm.sh/${pkg}${dev ? '?dev' : ''}';`)
  .join('\n')}
</script>`}
        </CodeBlock>
      </TabItem>
    </Tabs>
  );
}
