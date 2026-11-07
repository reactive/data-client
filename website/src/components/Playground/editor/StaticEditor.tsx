import { usePrismTheme } from '@docusaurus/theme-common';
import { Highlight, type Token } from 'prism-react-renderer';
import React, { memo } from 'react';

import { isPlainToken, mergeTokens } from './mergeTokens';
import { isMonacoTokenized } from '../monaco/language';
import { codePrismTheme } from '../monaco/theme';
import { monacoPrism } from '../monaco/tokenize';

const LINE_END: Token = { types: ['plain'], content: '\n' };

/**
 * Prism-highlighted, non-editable code. Renders identically on server and
 * client, so it is the SSG/crawler markup and the placeholder until Monaco
 * mounts. Draws what ../PlaygroundLiveEditor does (react-live's markup and
 * colors), with as few elements as draw it (mergeTokens).
 */
function StaticEditor({ code, language }: { code: string; language: string }) {
  const siteTheme = usePrismTheme();
  const monaco = isMonacoTokenized(language);
  const theme = monaco ? codePrismTheme : siteTheme;
  return (
    <div>
      <Highlight
        code={code}
        language={language}
        theme={theme}
        prism={monaco ? monacoPrism : undefined}
      >
        {({ className, style, tokens, getTokenProps }) => (
          <pre
            className={className}
            style={{
              margin: 0,
              outline: 'none',
              padding: 10,
              fontFamily: 'inherit',
              ...style,
            }}
            spellCheck="false"
          >
            {tokens.map((line, lineIndex) => (
              // the <pre> draws the plain color, so lines need no style
              <span key={lineIndex} className="token-line">
                {mergeTokens(
                  [...line.filter(token => !token.empty), LINE_END],
                  getTokenProps,
                  theme?.plain,
                ).map((token, tokenIndex) =>
                  isPlainToken(token) ?
                    token.content
                  : <span key={tokenIndex} {...getTokenProps({ token })} />,
                )}
              </span>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
export default memo(StaticEditor);
