import { useStorageSlot } from '@docusaurus/theme-common';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

import { installCommand, type PackageManager } from './installCommand';

interface Props {
  pkgs: string;
  dev?: boolean;
  global?: boolean;
}

export default function PkgInstall({ pkgs, dev, global }: Props) {
  const [relevantTabGroupChoice] = useStorageSlot(
    'docusaurus.tab.node-packages-program',
  );
  const manager: PackageManager =
    relevantTabGroupChoice === 'yarn' || relevantTabGroupChoice === 'pnpm' ?
      relevantTabGroupChoice
    : 'npm';
  return (
    <CodeBlock className="language-bash">
      {installCommand(manager, pkgs, { dev, global })}
    </CodeBlock>
  );
}
