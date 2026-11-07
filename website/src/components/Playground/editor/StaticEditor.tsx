import { Highlight, type Token } from 'prism-react-renderer';
import React, { memo } from 'react';

import { isPlainToken, mergeTokens } from './mergeTokens';
import useCodeTheme from './useCodeTheme';

const LINE_END: Token = { types: ['plain'], content: '\n' };

/**
 * Prism-highlighted, non-editable code. Renders identically on server and
 * client, so it is the SSG/crawler markup and the placeholder until Monaco
 * mounts. Draws what ../PlaygroundLiveEditor does (react-live 5's markup and
 * colors; recheck on react-live upgrades), with as few elements as draw it
 * (mergeTokens).
 */
function StaticEditor({ code, language }: { code: string; language: string }) {
  const { theme, prism } = useCodeTheme(language);
  return (
    <div>
      <Highlight code={code} language={language} theme={theme} prism={prism}>
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
