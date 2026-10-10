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

const MANAGERS = [
  { label: 'NPM', value: 'npm' },
  { label: 'Yarn', value: 'yarn' },
  { label: 'pnpm', value: 'pnpm' },
] as const;

export default function PkgTabs({ pkgs, dev = false }: Props) {
  return (
    <Tabs defaultValue="npm" groupId="node-packages-program">
      {MANAGERS.map(({ label, value }) => (
        <TabItem key={value} value={value} label={label}>
          <CodeBlock className="language-bash">
            {installCommand(value, pkgs, { dev })}
          </CodeBlock>
        </TabItem>
      ))}
      {/* dev dependencies are build/test tooling, which a browser CDN can't provide */}
      {!dev && (
        <TabItem value="esm" label="esm.sh">
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
