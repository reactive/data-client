import { translate } from '@docusaurus/Translate';
import {
  parseCodeBlockTitle,
  parseLanguage,
} from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/CodeBlock';
import CodeBlock from '@theme-original/CodeBlock';
import React from 'react';

import { SHELLS } from './shells';
import AgentPrompt from '../../components/AgentPrompt';
import { metaFlag } from '../../components/Playground/editor/codeModel';

/** ```prompt fences are typed into a coding agent's chat, not a terminal, so
 * they render as the agent prompt chip (shell blocks: ./Layout).
 * `framed` in the meta (```bash framed) gives both a header, where the page has room. */
export default function CodeBlockWrapper(props: Props) {
  const language = props.language ?? parseLanguage(props.className);
  const metaTitle = parseCodeBlockTitle(props.metastring);
  const framed = metaFlag(props.metastring ?? '', 'framed');
  if (language === 'prompt' && typeof props.children === 'string') {
    return (
      <AgentPrompt
        prompt={props.children.trim()}
        title={
          metaTitle ||
          (typeof props.title === 'string' ? props.title : undefined)
        }
        framed={framed}
      />
    );
  }
  // ./Title gives shell titles the terminal icon
  if (framed && language && SHELLS.has(language) && !metaTitle) {
    return (
      <CodeBlock
        {...props}
        title={
          props.title ??
          translate({
            id: 'theme.CodeBlock.terminalTitle',
            message: 'Terminal',
            description: 'Header of framed code blocks of shell commands',
          })
        }
      />
    );
  }
  return <CodeBlock {...props} />;
}
