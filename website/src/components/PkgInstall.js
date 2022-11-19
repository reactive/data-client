import { useTabGroupChoice } from '@docusaurus/theme-common/internal';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

export default function PkgInstall({ pkgs, dev = false }) {
  const { tabGroupChoices } = useTabGroupChoice();
  const relevantTabGroupChoice = tabGroupChoices['node-packages-program'];
  if (relevantTabGroupChoice === 'yarn') {
    return (
      <CodeBlock className="language-bash">
        yarn add {dev ? '--dev ' : ''}
        {pkgs}
      </CodeBlock>
    );
  }
  return (
    <CodeBlock className="language-bash">
      npm install --save{dev ? 'Dev ' : ''} {pkgs}
    </CodeBlock>
  );
}
