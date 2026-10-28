/// <reference types="jest" />
import { Endpoint, Entity, schema } from '@data-client/endpoint';
import {
  actionTypes,
  Controller,
  DataProvider,
  NetworkManager,
  useController,
  useSuspense,
} from '@data-client/react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React, { Suspense } from 'react';

import { findEntry, type LogEntry } from '../store/actionLog';
import { asHook, callerNow, evaluatedFrames } from '../store/callSite';
import { userEvent } from '../store/fetchCause';
import SchemaRegistry from '../store/schemaRegistry';

class Post extends Entity {
  id = '';
  title = '';
}
const getPost = new Endpoint(
  async ({ id }: { id: string }) => ({ id, title: `Post ${id}` }),
  {
    schema: Post,
    key: ({ id }: { id: string }) => `GET /posts/${id}`,
    name: 'getPost',
  },
);
const updatePost = new Endpoint(
  async ({ id }: { id: string }) => ({ id, title: 'Saved' }),
  {
    schema: Post,
    sideEffect: true,
    key: ({ id }: { id: string }) => `PATCH /posts/${id}`,
    name: 'updatePost',
  },
);
class User extends Entity {
  id = '';
  name = '';
}
class Comment extends Entity {
  id = '';
  author = User.fromJS();
  static schema = { author: User };
}
const getComment = new Endpoint(
  async ({ id }: { id: string }) => ({ id, author: { id: 'u1', name: 'Ann' } }),
  {
    schema: Comment,
    key: ({ id }: { id: string }) => `GET /comments/${id}`,
    name: 'getComment',
  },
);
const deleteUser = new Endpoint(async ({ id }: { id: string }) => ({ id }), {
  schema: new schema.Invalidate(User),
  sideEffect: true,
  key: ({ id }: { id: string }) => `DELETE /users/${id}`,
  name: 'deleteUser',
});
/** Fails while `failing.now` */
const failing = { now: false };
const getFlaky = new Endpoint(
  async () => {
    if (failing.now) throw new Error('down');
    return { ok: true };
  },
  { key: () => 'GET /flaky', name: 'getFlaky' },
);
/** As the preview's scope gives it to the code */
const useSuspenseNamed = asHook('useSuspense', useSuspense);

function ShowPost() {
  const post = useSuspenseNamed(getPost, { id: '1' });
  return <p>{post.title}</p>;
}

function ShowComment() {
  const comment = useSuspenseNamed(getComment, { id: 'c1' });
  return <p>By {comment.author.name}</p>;
}

function mount(view: React.ReactNode = <ShowPost />) {
  const registry = new SchemaRegistry({ trimEvery: 1, caller: callerNow });
  const network = new NetworkManager();
  const log = registry.log.connect(0, undefined, action =>
    network.skipLogging(action),
  );
  const managers = [log.head, registry, ...log.track([network]), log.tail];
  const ref: { ctrl?: Controller } = {};
  function Buttons() {
    const ctrl = (ref.ctrl = useController());
    return (
      <button onClick={() => ctrl.fetch(updatePost, { id: '1' })}>
        Save post
      </button>
    );
  }
  render(
    <DataProvider managers={managers} devButton={null}>
      <Buttons />
      <Suspense fallback="loading">{view}</Suspense>
    </DataProvider>,
  );
  const entries = () => registry.log.history(0).entries;
  return {
    ctrl: () => ref.ctrl!,
    log: registry.log,
    entries,
    fetches: () =>
      entries().filter(
        e =>
          e.action.type === actionTypes.FETCH && !e.action.endpoint.sideEffect,
      ),
  };
}

const lastOf = (entries: readonly LogEntry[]) => entries[entries.length - 1];

describe('why a fetch happened', () => {
  it('credits a first load to the hook, with nothing stored', async () => {
    const { fetches } = mount();
    await screen.findByText('Post 1');
    const [first] = fetches();
    expect(first.reason).toBe('missing');
    expect(first.caller).toEqual({ hook: 'useSuspense' });
  });

  it('links a refetch to the invalidate that made it', async () => {
    const { ctrl, log, entries, fetches } = mount();
    await screen.findByText('Post 1');
    act(() => {
      ctrl().invalidate(getPost, { id: '1' });
    });
    await screen.findByText('Post 1');
    const refetch = lastOf(fetches());
    expect(refetch.reason).toBe('invalid');
    const cause = findEntry(entries(), refetch.causedBy!);
    expect(cause?.action.type).toBe(actionTypes.INVALIDATE);
    // one request, however many fetches shared it
    expect(log.refetches(entries()).get(cause!.seq)).toBe(1);
  });

  it('links a refetch to the expireAll that made it stale', async () => {
    const { ctrl, entries, fetches } = mount();
    await screen.findByText('Post 1');
    const before = fetches().length;
    act(() => {
      ctrl().expireAll({ testKey: key => key.startsWith('GET /posts') });
    });
    await waitFor(() => expect(fetches().length).toBeGreaterThan(before));
    const refetch = lastOf(fetches());
    expect(refetch.reason).toBe('stale');
    expect(findEntry(entries(), refetch.causedBy!)?.action.type).toBe(
      actionTypes.EXPIREALL,
    );
  });

  it('links a refetch to an invalidated entity nested in its data', async () => {
    const { ctrl, log, entries, fetches } = mount(<ShowComment />);
    await screen.findByText('By Ann');
    const before = fetches().length;
    act(() => {
      ctrl().fetch(deleteUser, { id: 'u1' });
    });
    await waitFor(() => expect(fetches().length).toBeGreaterThan(before));
    const refetch = lastOf(fetches());
    expect(refetch.reason).toBe('invalid');
    const cause = findEntry(entries(), refetch.causedBy!);
    expect(cause?.action.type).toBe(actionTypes.SET_RESPONSE);
    expect(log.refetches(entries()).get(cause!.seq)).toBe(1);
  });

  it('says a retry came after an error, though data stayed', async () => {
    const { ctrl, entries, fetches } = mount();
    await screen.findByText('Post 1');
    const responses = () =>
      entries().filter(
        e =>
          e.action.type === actionTypes.SET_RESPONSE &&
          e.action.key === 'GET /flaky',
      ).length;
    const flaky = async (fail: boolean) => {
      failing.now = fail;
      const before = responses();
      act(() => {
        ctrl()
          .fetch(getFlaky)
          .catch(() => undefined);
      });
      await waitFor(() => expect(responses()).toBeGreaterThan(before));
    };
    await flaky(false);
    await flaky(true);
    await flaky(false);
    expect(lastOf(fetches()).reason).toBe('error');
  });

  it('says a fresh fetch was asked for anyway', async () => {
    const { ctrl, fetches } = mount();
    await screen.findByText('Post 1');
    const before = fetches().length;
    act(() => {
      ctrl().fetch(getPost, { id: '1' });
    });
    await waitFor(() => expect(fetches().length).toBeGreaterThan(before));
    const again = lastOf(fetches());
    expect(again.reason).toBe('fresh');
    expect(again.caller).toBeUndefined();
    expect(again.causedBy).toBeUndefined();
  });

  it('credits a mutation to the click that sent it', async () => {
    const { entries } = mount();
    await screen.findByText('Post 1');
    act(() => {
      fireEvent.click(screen.getByText('Save post'));
    });
    const mutation = entries().find(
      e => e.action.type === actionTypes.FETCH && e.action.endpoint.sideEffect,
    );
    expect(mutation?.reason).toBe('mutation');
    expect(mutation?.caller).toEqual({
      event: { type: 'click', target: 'Save post' },
    });
  });
});

describe('callSite', () => {
  it('reads the code’s functions from V8 and SpiderMonkey stacks', () => {
    const v8 = [
      'Error',
      '    at callerNow (http://localhost/main.js:10:5)',
      '    at useFetch (eval at evalCode (http://localhost/x.js:1:2), <anonymous>:4:10)',
      '    at ShowTime (eval at evalCode (http://localhost/x.js:1:2), <anonymous>:12:30)',
      '    at renderWithHooks (http://localhost/react-dom.js:1:1)',
    ].join('\n');
    expect(evaluatedFrames(v8)).toEqual(['useFetch', 'ShowTime']);
    const firefox = [
      'callerNow@http://localhost/main.js:10:5',
      'ShowTime@http://localhost/x.js line 2 > Function:12:30',
      'renderWithHooks@http://localhost/react-dom.js:1:1',
    ].join('\n');
    expect(evaluatedFrames(firefox)).toEqual(['ShowTime']);
  });

  it('names no caller outside a hook or a user event', () => {
    expect(callerNow()).toBeUndefined();
  });

  it('names a user event’s target as a person would', () => {
    const button = document.createElement('button');
    button.innerHTML = '<span>Invalidate</span>  First';
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: button.firstChild });
    expect(userEvent(event)).toEqual({
      type: 'click',
      target: 'Invalidate First',
    });
    expect(userEvent(new Event('load'))).toBeUndefined();
  });

  it('never names a field by what a person typed into it', () => {
    document.body.innerHTML =
      '<label for="pw">Password</label><input id="pw" type="password" value="hunter2">';
    const event = new Event('input');
    Object.defineProperty(event, 'target', {
      value: document.getElementById('pw'),
    });
    expect(userEvent(event)).toEqual({ type: 'input', target: 'Password' });
    document.body.innerHTML = '';
  });
});
