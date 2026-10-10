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
      {(['npm', 'yarn', 'pnpm'] as const).map(manager => (
        <TabItem key={manager} value={manager}>
          <CodeBlock className="language-bash">
            {installCommand(manager, pkgs, { dev })}
          </CodeBlock>
        </TabItem>
      ))}
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
