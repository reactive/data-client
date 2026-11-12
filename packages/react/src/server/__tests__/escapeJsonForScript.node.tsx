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
    __proto__: { polluted: true },
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
    const parsed = JSON.parse(escapeJsonForScript(JSON.stringify(hostile)));
    expect(parsed).toEqual(JSON.parse(JSON.stringify(hostile)));
    expect(parsed.title).toBe(hostile.title);
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
    const open = html.indexOf('<script');
    const tagEnd = html.indexOf('>', open);
    const close = html.toLowerCase().indexOf('</script', tagEnd);
    expect(open).toBeGreaterThanOrEqual(0);
    expect(html.toLowerCase().indexOf('</script', close + 1)).toBe(-1);
    expect(html).toContain('nonce="abc"');
    const inner = html.slice(tagEnd + 1, close);
    expect(JSON.parse(inner).endpoints[hostile.title]).toBe(hostile.title);
  });

  it('adds no element to the page when API data holds markup', () => {
    const title = '</script><img src=x onerror="alert(1)">';
    const state = {
      ...initialState,
      entities: { Todo: { '1': { id: '1', title } } },
    };
    const html = renderToString(
      <main>
        <ServerData data={state} />
        <p>after</p>
      </main>,
    );
    const { document } = new JSDOM(html).window;
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('p')?.textContent).toBe('after');
    const text = document.getElementById('data-client-data')!.textContent!;
    expect(JSON.parse(text)).toEqual(state);
  });
});
