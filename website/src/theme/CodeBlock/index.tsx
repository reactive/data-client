import { translate } from '@docusaurus/Translate';
import {
  parseCodeBlockTitle,
  parseLanguage,
} from '@docusaurus/theme-common/internal';
import type { Props } from '@theme/CodeBlock';
import CodeBlock from '@theme-original/CodeBlock';
import React, { useContext } from 'react';

import { SHELLS } from './shells';
import AgentPrompt from '../../components/AgentPrompt';
import {
  HiddenContext,
  useHiddenUntilIdle,
} from '../../components/Playground/hiddenContext';
import { metaFlag } from '../../utils/fenceMeta';

/** ```prompt fences are typed into a coding agent's chat, not a terminal, so
 * they render as the agent prompt chip (shell blocks: ./Layout).
 * `framed` in the meta (```bash framed) gives both a header, where the page has room. */
export default function CodeBlockWrapper(props: Props) {
  // not shown (an unselected tab, a closed details): plain text (./Line)
  // until the page is idle, then highlighted ahead of being shown
  const [plain] = useHiddenUntilIdle(useContext(HiddenContext));
  const language = props.language ?? parseLanguage(props.className);
  // a title in the meta wins, as in Docusaurus's own CodeBlock
  const title =
    parseCodeBlockTitle(props.metastring) ||
    (typeof props.title === 'string' ? props.title : undefined);
  const framed = metaFlag(props.metastring ?? '', 'framed');
  if (language === 'prompt' && typeof props.children === 'string') {
    return (
      <AgentPrompt
        prompt={props.children.trim()}
        title={title}
        framed={framed}
      />
    );
  }
  // ./Title gives shell titles the terminal icon
  const terminalTitle =
    framed && language && SHELLS.has(language) && !title ?
      translate({
        id: 'theme.CodeBlock.terminalTitle',
        message: 'Terminal',
        description: 'Header of framed code blocks of shell commands',
      })
    : undefined;
  return (
    <HiddenContext.Provider value={plain}>
      <CodeBlock {...props} title={terminalTitle ?? props.title} />
    </HiddenContext.Provider>
  );
}
