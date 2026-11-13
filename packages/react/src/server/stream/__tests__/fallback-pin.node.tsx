import { Endpoint, Entity } from '@data-client/endpoint';
import React from 'react';
import { Writable } from 'stream';

import { AsyncBoundary, useSuspense } from '../../../index';
import { createServerStream } from '../index';

const describeReact19 =
  Number(React.version.split('.')[0]) >= 19 ? describe : describe.skip;

class Quote extends Entity {
  id = '';
  price = 0;
  static key = 'Quote';
}

describeReact19('a boundary inside a fallback', () => {
  it('gets no pin: the browser never hydrates a fallback, so nothing would release it', async () => {
    const { renderToPipeableStream } = require('react-dom/server.node');
    let resolve!: (value: object) => void;
    const pending = new Promise<object>(r => (resolve = r));
    const getQuote = new Endpoint(() => pending, {
      schema: Quote,
      name: 'getQuote',
      key: () => 'GET /q',
    });
    function Slow() {
      return <b>{useSuspense(getQuote).price}</b>;
    }
    const stream = createServerStream();
    const messages: any[] = [];
    let html = '';
    await new Promise<void>(done => {
      const dest = new Writable({
        write(chunk, _encoding, callback) {
          html += String(chunk);
          callback();
        },
        final(callback) {
          messages.push(...stream.ledger.end());
          callback();
          done();
        },
      }) as Writable & { flush(): void };
      dest.flush = () => {
        messages.push(...stream.ledger.take());
      };
      const { pipe } = renderToPipeableStream(
        <stream.Provider>
          {/* a host element, so React sends the shell before the boundary completes */}
          <div>
            <AsyncBoundary
              fallback={
                <AsyncBoundary fallback={<i>inner fallback</i>}>
                  <span>skeleton</span>
                </AsyncBoundary>
              }
            >
              <Slow />
            </AsyncBoundary>
          </div>
        </stream.Provider>,
        {
          onShellReady() {
            pipe(dest);
            setTimeout(() => resolve({ id: 'q', price: 7 }), 20);
          },
        },
      );
    });
    // the server rendered the fallback's boundary, then the content replaced it
    expect(html).toContain('skeleton');
    expect(html).toContain('<b>7</b>');
    const pinned = new Set(messages.filter(m => m.t === 'pin').map(m => m.id));
    expect(pinned.size).toBe(1);
  });
});
