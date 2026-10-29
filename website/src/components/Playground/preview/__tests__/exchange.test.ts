/// <reference types="jest" />
import { RestEndpoint } from '@data-client/rest';

import type { CodeDocument } from '../../editor/codeModel';
import type { FixtureOrInterceptor } from '../../types';
import { firstExchange } from '../exchange/LiveExchange';
import type { Exchange } from '../exchange/network';
import {
  compileExchanges,
  runExchanges,
  runLive,
} from '../exchange/runExchanges';

// the real scope pulls in the website's design system and dependencies
jest.mock('../scope', () => ({
  previewScope: { ...require('@data-client/rest') },
}));

const file = (value: string, language = 'ts'): CodeDocument => ({
  value,
  language,
  path: `${language}-${value.length}.${language}`,
  collapsed: false,
});

const resourceFile =
  file(`import { resource, Entity, RestEndpoint, type RestGenerics } from '@data-client/rest';

class AuthdEndpoint<O extends RestGenerics = any> extends RestEndpoint<O> {
  async getRequestInit(body: any): Promise<RequestInit> {
    return { ...(await super.getRequestInit(body)), credentials: 'same-origin' };
  }
}
class Post extends Entity {
  id = '';
  title = '';
}
export const PostResource = resource({
  path: '/:group/posts/:id',
  searchParams: {} as { author?: string },
  schema: Post,
  Endpoint: AuthdEndpoint,
});`);

const posts: Record<string, { id: string; title: string }> = {
  '1': { id: '1', title: 'first' },
};
const fixtures: FixtureOrInterceptor[] = [
  {
    endpoint: new RestEndpoint({ path: '/:group/posts/:id' }),
    response({ id }: { id: string }) {
      if (!posts[id]) throw { status: 404, message: 'missing' };
      return posts[id];
    },
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts', method: 'POST' }),
    response(params: object, body: object) {
      return { id: '2', ...params, ...body };
    },
  },
  {
    endpoint: new RestEndpoint({ path: '/broken' }),
    response() {
      throw 'down';
    },
  },
  {
    endpoint: new RestEndpoint({ path: '/:group/posts/:id', method: 'DELETE' }),
    response() {
      return null;
    },
  },
];

function run(
  usage: string,
  documents = [resourceFile],
  answers: FixtureOrInterceptor[] = fixtures,
) {
  const calls: Promise<Exchange>[] = [];
  const done = runExchanges(
    compileExchanges([...documents, file(usage)]),
    answers,
    undefined,
    call => calls.push(call),
  );
  return { calls, done };
}

function exchanges(...args: Parameters<typeof run>) {
  const { calls, done } = run(...args);
  // an endpoint's failure shows in its exchange
  done.catch(() => undefined);
  return calls;
}

describe('runExchanges', () => {
  test('records the request the code builds, answered by its interceptor', async () => {
    const [exchange] = exchanges(
      `PostResource.get({ group: 'react', id: '1' });`,
    );
    expect(await exchange).toEqual({
      input: '/react/posts/1',
      init: expect.objectContaining({
        method: 'GET',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
      }),
      status: 200,
      body: posts['1'],
    });
  });

  test("passes a mutation's args, and answers a create with 201", async () => {
    const [exchange] = exchanges(
      `PostResource.getList.push({ group: 'react', author: 'clara' }, { title: 'new' });`,
    );
    expect(await exchange).toMatchObject({
      input: '/react/posts?author=clara',
      init: { method: 'POST', body: '{"title":"new"}' },
      status: 201,
      body: { id: '2', group: 'react', author: 'clara', title: 'new' },
    });
  });

  test('a thrown answer is its error status; nothing to answer is a 404', async () => {
    const [missing, unmatched] = exchanges(`
      PostResource.get({ group: 'react', id: '7' });
      PostResource.partialUpdate({ group: 'react', id: '1' }, { title: 'x' });
    `);
    // the thrown status is the answer's, the rest its body
    const { status, body } = await missing;
    expect([status, body]).toEqual([404, { message: 'missing' }]);
    expect(await unmatched).toMatchObject({
      init: { method: 'PATCH' },
      status: 404,
    });
    expect((await unmatched).body).toBeUndefined();
  });

  test('a thrown non-object answers 500 with its message', async () => {
    const [exchange] = exchanges(
      `new RestEndpoint({ path: '/broken' })().catch(() => {});`,
    );
    const { status, body } = await exchange;
    expect([status, body]).toEqual([500, { message: 'down' }]);
  });

  test('an empty answer is a 204', async () => {
    const [exchange] = exchanges(
      `PostResource.delete({ group: 'react', id: '1' });`,
    );
    const { status, body } = await exchange;
    expect([status, body]).toEqual([204, undefined]);
  });

  test('lists every call in order, and one per call through extend()', async () => {
    const calls = exchanges(`
      PostResource.get({ group: 'a', id: '1' });
      PostResource.get.extend({ name: 'again' })({ group: 'b', id: '1' });
    `);
    expect(calls).toHaveLength(2);
    expect((await calls[1]).input).toBe('/b/posts/1');
  });

  test('rejects the exchange when the endpoint fails before sending', async () => {
    const [exchange] = exchanges(`
      const broken = new RestEndpoint({ path: '/x' }).extend({
        getHeaders() {
          throw new Error('no token');
        },
      });
      broken();
    `);
    await expect(exchange).rejects.toThrow('no token');
  });

  test('records calls the code makes later, after an await', async () => {
    const calls = exchanges(`
      PostResource.get({ group: 'a', id: '1' }).then(() =>
        PostResource.get({ group: 'b', id: '1' }),
      );
    `);
    await calls[0];
    await new Promise(resolve => setTimeout(resolve));
    expect(calls).toHaveLength(2);
    expect((await calls[1]).input).toBe('/b/posts/1');
  });

  test('answers a GraphQL operation 200, not 201 for its POST', async () => {
    const calls = exchanges(
      `
        new GQLEndpoint('/graphql').query(
          'query GetUser($id: ID!) { user(id: $id) { id } }',
        )({ id: '5' });
      `,
      [],
      [
        {
          endpoint: { testKey: () => true } as any,
          response: ({ id }: { id: string }) => ({ user: { id } }),
        },
      ],
    );
    expect(await calls[0]).toMatchObject({
      init: { method: 'POST' },
      status: 200,
      body: { user: { id: '5' } },
    });
  });

  test('answers a GQLEndpoint from fixtures too', async () => {
    const [exchange] = exchanges(`
      const getUser = new GQLEndpoint('/graphql').query(
        'query GetUser($id: ID!) { user(id: $id) { id } }',
      );
      getUser({ id: '5' });
    `);
    expect(await exchange).toMatchObject({
      input: '/graphql',
      init: { method: 'POST' },
      status: 404,
    });
  });

  test('a bare fetch() fails instead of reaching the network', async () => {
    await expect(run(`fetch('https://example.com');`).done).rejects.toThrow(
      'Live demos answer only requests their endpoints send',
    );
  });

  test('skips files that are not scripts', async () => {
    const vue = file('<template><AuthForm /></template>', 'html');
    expect(
      exchanges(`PostResource.get({ group: 'a', id: '1' });`, [
        resourceFile,
        vue,
      ]),
    ).toHaveLength(1);
  });

  test('rejects with what the code throws, and compiling throws a SyntaxError for code that does not compile', async () => {
    await expect(run(`throw new Error('boom');`).done).rejects.toThrow('boom');
    expect(() => compileExchanges([file('PostResource.get({')])).toThrow();
  });

  test('awaits at the top level', async () => {
    const { calls, done } = run(`
      const post = await PostResource.get({ group: 'a', id: '1' });
      PostResource.get({ group: post.title, id: '1' });
    `);
    await done;
    expect((await Promise.all(calls)).map(({ input }) => input)).toEqual([
      '/a/posts/1',
      '/first/posts/1',
    ]);
  });
});

describe('firstExchange', () => {
  const first = (usage: string) =>
    firstExchange([resourceFile, file(usage)], fixtures);

  test("is the last call's exchange as the code first runs", async () => {
    const { exchange, error } = await first(`
      PostResource.get({ group: 'a', id: '1' });
      PostResource.get({ group: 'b', id: '1' });
    `);
    expect([exchange?.input, error]).toEqual(['/b/posts/1', undefined]);
  });

  test('waits for a call made after an await, as an edit shows', async () => {
    const { exchange } = await first(`
      PostResource.get({ group: 'a', id: '1' }).then(() =>
        PostResource.get({ group: 'b', id: '1' }),
      );
    `);
    expect(exchange?.input).toBe('/b/posts/1');
  });

  test('a throw wins, before or after a call', async () => {
    expect((await first(`throw new Error('before');`)).error).toBe(
      'Error: before',
    );
    expect(
      (
        await first(`
          PostResource.get({ group: 'a', id: '1' });
          throw new Error('after');
        `)
      ).error,
    ).toBe('Error: after');
  });
});

describe('runLive', () => {
  const outcomes = async (usage: string) => {
    const reports: unknown[] = [];
    runLive(
      compileExchanges([resourceFile, file(usage)]),
      fixtures,
      undefined,
      outcome => reports.push(outcome),
    );
    await new Promise(resolve => setTimeout(resolve, 10));
    return reports;
  };

  test("a throw after a call outlasts the call's answer", async () => {
    expect(
      await outcomes(`
        PostResource.get({ group: 'a', id: '1' });
        throw new Error('after');
      `),
    ).toEqual([{ error: 'Error: after' }]);
  });

  test("a later call's exchange replaces the first's", async () => {
    const reports = await outcomes(`
      PostResource.get({ group: 'a', id: '1' }).then(() =>
        PostResource.get({ group: 'b', id: '1' }),
      );
    `);
    expect(reports.map((r: any) => r.exchange.input)).toEqual([
      '/a/posts/1',
      '/b/posts/1',
    ]);
  });

  test("an awaited call's error answer shows as its exchange, not a throw", async () => {
    const reports = await outcomes(
      `await PostResource.get({ group: 'a', id: 'missing' });`,
    );
    expect(reports).toEqual([
      { exchange: expect.objectContaining({ status: 404 }) },
    ]);
  });

  test('a throw before any call is the one outcome', async () => {
    expect(await outcomes(`throw new Error('before');`)).toEqual([
      { error: 'Error: before' },
    ]);
  });

  test('with no call, reports one empty outcome', async () => {
    expect(await outcomes(`const x = 1;`)).toEqual([{}]);
  });
});
