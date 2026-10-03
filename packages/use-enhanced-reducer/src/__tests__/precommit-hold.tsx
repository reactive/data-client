import { useEffect, useRef, version } from 'react';
import type { ReactElement } from 'react';

import useEnhancedReducer from '../useEnhancedReducer';

type RootKind = 'legacy' | 'concurrent';

const reactMajor = Number(version.split('.')[0]);

function mount(kind: RootKind, node: ReactElement, container: Element) {
  if (kind === 'legacy') {
    // React 19 types drop `render`
    const dom: {
      render(node: ReactElement, container: Element): void;
      unmountComponentAtNode(container: Element): boolean;
    } = require('react-dom');
    dom.render(node, container);
    return () => {
      dom.unmountComponentAtNode(container);
    };
  }
  const client: typeof import('react-dom/client') = require('react-dom/client');
  const root = client.createRoot(container);
  root.render(node);
  return () => root.unmount();
}

function tick() {
  return new Promise(resolve => setTimeout(resolve, 20));
}

interface Action {
  n: number;
}

let unmount = () => {};

function setup(kind: RootKind) {
  const container = document.createElement('div');
  const read = () => container.textContent;
  const counts = { renders: 0 };
  const resolved: (string | null)[] = [];
  let dispatch: (action: Action) => Promise<void> = () => Promise.resolve();
  function Counter() {
    counts.renders += 1;
    const [state, d] = useEnhancedReducer(
      (_: Action, action: Action) => action,
      { n: 0 },
      [],
    );
    const once = useRef(false);
    if (!once.current) {
      once.current = true;
      d({ n: 1 });
      d({ n: 2 }).then(() => resolved.push(read()));
    }
    useEffect(() => {
      dispatch = d;
    }, [d]);
    return <span>{state.n}</span>;
  }
  unmount = mount(kind, <Counter />, container);
  return {
    counts,
    resolved,
    read,
    dispatch: (action: Action) => dispatch(action),
  };
}

const kinds = (['legacy', 'concurrent'] as const).filter(kind =>
  kind === 'legacy' ? reactMajor <= 18 : reactMajor >= 18,
);

describe.each(kinds)('dispatch before commit on a %s root', kind => {
  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  let prevAct: boolean | undefined;
  beforeAll(() => {
    prevAct = g.IS_REACT_ACT_ENVIRONMENT;
    g.IS_REACT_ACT_ENVIRONMENT = false;
  });
  afterAll(() => {
    g.IS_REACT_ACT_ENVIRONMENT = prevAct;
  });
  beforeEach(() => {
    // 17 warns about updates outside act(); 18 warns that ReactDOM.render is deprecated
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    unmount();
    jest.restoreAllMocks();
  });

  it('replays held actions in one render from the mount effect', async () => {
    const { counts, resolved, read } = setup(kind);
    if (kind === 'legacy') {
      // committed synchronously, mount effect still pending
      expect(counts.renders).toBe(1);
      expect(read()).toBe('0');
    } else {
      expect(counts.renders).toBe(0);
    }
    await tick();
    expect(counts.renders).toBe(2);
    expect(read()).toBe('2');
    expect(resolved).toEqual(['2']);
  });

  it('batches two dispatches from a promise callback only on concurrent roots', async () => {
    const { counts, dispatch, read } = setup(kind);
    await tick();
    const before = counts.renders;
    await Promise.resolve().then(() => {
      dispatch({ n: 3 });
      dispatch({ n: 4 });
    });
    await tick();
    if (kind === 'legacy') expect(counts.renders - before).toBeGreaterThan(1);
    else expect(counts.renders - before).toBe(1);
    expect(read()).toBe('4');
  });
});
