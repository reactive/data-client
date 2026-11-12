import { initialState } from '@data-client/core';
import { JSDOM } from 'jsdom';
import { renderToString } from 'react-dom/server';

import { escapeJsonForScript } from '../escapeJsonForScript';
import ServerData from '../ServerData';

describe('escapeJsonForScript', () => {
  const hostile = {
    title: '</script><script>alert(1)</script>',
    line: 'a\u2028b\u2029c',
    amp: 'x & y > z',
  };

  it('keeps the payload inside its script tag', () => {
    const escaped = escapeJsonForScript(JSON.stringify(hostile));
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
    expect(escaped).not.toContain('&');
    expect(escaped).not.toContain('\u2028');
    expect(escaped).not.toContain('\u2029');
  });

  it('remains valid JSON with the same content', () => {
    expect(JSON.parse(escapeJsonForScript(JSON.stringify(hostile)))).toEqual(
      hostile,
    );
  });

  it('is applied by ServerData, so API data adds no element to the page', () => {
    const title = '</script><img src=x onerror="alert(1)">';
    const state = {
      ...initialState,
      entities: { Todo: { '1': { id: '1', title } } },
      endpoints: { [hostile.title]: hostile.title },
    };
    const html = renderToString(
      <main>
        <ServerData data={state} nonce="abc" />
        <p>after</p>
      </main>,
    );
    expect(html).toContain('nonce="abc"');
    const { document } = new JSDOM(html).window;
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('p')?.textContent).toBe('after');
    const text = document.getElementById('data-client-data')!.textContent!;
    expect(JSON.parse(text)).toEqual(state);
  });
});
