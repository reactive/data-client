import CodeBlock from '@theme/CodeBlock';
import React from 'react';

import {
  installCommand,
  PACKAGE_MANAGER_TAB_GROUP,
  type PackageManager,
} from './installCommand';
import { useTabStorage } from '../utils/tabStorage';

interface Props {
  pkgs: string;
  dev?: boolean;
  global?: boolean;
}

export default function PkgInstall({ pkgs, dev, global }: Props) {
  const [relevantTabGroupChoice] = useTabStorage(PACKAGE_MANAGER_TAB_GROUP);
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
