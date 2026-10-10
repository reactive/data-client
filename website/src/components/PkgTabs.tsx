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
        // dev dependencies are build/test tooling, which a browser CDN can't provide
        ...(dev ? [] : [{ label: 'esm.sh', value: 'esm' }]),
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
      {!dev && (
        <TabItem value="esm">
          <CodeBlock className="language-html">
            {`<script type="importmap">
{
  "imports": {
${pkgs
  .split(' ')
  .map(
    pkg =>
      `    "${pkg.replace(/^(@?[^@]+).*/, '$1')}": "https://esm.sh/${pkg}"`,
  )
  .join(',\n')}
  }
}
</script>`}
          </CodeBlock>
        </TabItem>
      )}
    </Tabs>
  );
}
