import CodeBlock from '@theme/CodeBlock';
import TabItem from '@theme/TabItem';
import Tabs from '@theme/Tabs';
import React from 'react';

import { installCommand } from './installCommand';

interface Props {
  pkgs: string;
  dev?: boolean;
  upgrade?: boolean;
}

export default function PkgTabs({ pkgs, dev = false }: Props) {
  return (
    <Tabs
      defaultValue="npm"
      groupId="node-packages-program"
      values={[
        { label: 'NPM', value: 'npm' },
        { label: 'Yarn', value: 'yarn' },
        { label: 'pnpm', value: 'pnpm' },
        { label: 'esm.sh', value: 'esm' },
      ]}
    >
      <TabItem value="yarn">
        <CodeBlock className="language-bash">
          {installCommand('yarn', pkgs, { dev })}
        </CodeBlock>
      </TabItem>
      <TabItem value="npm">
        <CodeBlock className="language-bash">
          {installCommand('npm', pkgs, { dev })}
        </CodeBlock>
      </TabItem>
      <TabItem value="pnpm">
        <CodeBlock className="language-bash">
          {installCommand('pnpm', pkgs, { dev })}
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
