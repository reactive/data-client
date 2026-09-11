import { initialState } from '@data-client/core';
import { renderToString } from 'react-dom/server';

import { escapeJsonForHtml } from '../escapeJsonForHtml';
import ServerData from '../ServerData';

describe('escapeJsonForHtml', () => {
  const hostile = {
    title: '</script><script>alert(1)</script>',
    line: 'a\u2028b\u2029c',
    amp: 'x & y > z',
    __proto__: { polluted: true },
  };

  it('keeps the payload inside its script tag', () => {
    const escaped = escapeJsonForHtml(JSON.stringify(hostile));
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('&');
    expect(escaped).not.toContain('\u2028');
    expect(escaped).not.toContain('\u2029');
  });

  it('remains valid JSON with the same content', () => {
    const parsed = JSON.parse(escapeJsonForHtml(JSON.stringify(hostile)));
    expect(parsed).toEqual(JSON.parse(JSON.stringify(hostile)));
    expect(parsed.title).toBe(hostile.title);
  });

  it('works as the argument of an inline JSON.parse string literal', () => {
    const literal = escapeJsonForHtml(JSON.stringify(JSON.stringify(hostile)));
    const parsed = new Function(`return JSON.parse(${literal})`)();
    expect(parsed).toEqual(JSON.parse(JSON.stringify(hostile)));
    expect(({} as any).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
  });

  it('is applied by ServerData', () => {
    const html = renderToString(
      <ServerData
        data={{
          ...initialState,
          endpoints: { [hostile.title]: hostile.title },
        }}
        nonce="abc"
      />,
    );
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).toContain('nonce="abc"');
    const inner = html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    expect(JSON.parse(inner).endpoints[hostile.title]).toBe(hostile.title);
  });
});
