import { useStorageSlot } from '@docusaurus/theme-common';
import CodeBlock from '@theme/CodeBlock';
import React from 'react';

export default function PkgInstall({ pkgs, dev = false, global }) {
  const [relevantTabGroupChoice] = useStorageSlot(
    'docusaurus.tab.node-packages-program',
  );
  //const relevantTabGroupChoice = tabGroupChoices['node-packages-program'];
  if (relevantTabGroupChoice === 'yarn') {
    return (
      <CodeBlock className="language-bash">
        yarn add{global ? ' global' : ''} {dev ? '--dev ' : ''}
        {pkgs}
      </CodeBlock>
    );
  }
  return (
    <CodeBlock className="language-bash">
      npm install{global ? ' -g' : ' --save'}
      {dev ? 'Dev ' : ''} {pkgs}
    </CodeBlock>
  );
}
