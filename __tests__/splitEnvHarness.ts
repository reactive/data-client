/**
 * Server half and browser half of one streamed page, in one Node test.
 *
 * `useCacheState` picks its server branch when its module loads, from
 * `typeof window`, and jsdom's `window` cannot be removed. So the server half
 * loads the library with no DOM global, and the browser half installs jsdom and
 * loads every module again. The halves share only the strings React wrote.
 */

import vm from 'vm';

// Each test loads React's server and browser module graphs and a jsdom. A test
// that times out keeps running and tears down the next test's DOM.
jest.setTimeout(30_000);

/** Messages an inline ledger script pushes, read in a sandbox */
export function messagesOf(scriptTag: string): any[] {
  const source = scriptTag.replace(/^<script>/, '').replace(/<\/script>$/, '');
  if (!source) return [];
  const sandbox: any = {};
  sandbox.self = sandbox;
  vm.runInNewContext(source, sandbox);
  return JSON.parse(JSON.stringify(sandbox.__RDC_STREAM__));
}

/** Runs an inline ledger script the way the HTML parser would, in this realm */
export function runLedgerScript(scriptTag: string): void {
  const source = scriptTag.replace(/^<script>/, '').replace(/<\/script>$/, '');
  if (source) new Function(source)();
}

/** Resolves once `check` returns true, polling on timers. Rejects after `ms`. */
export async function until(
  check: () => boolean,
  label: string,
  ms = 2000,
): Promise<void> {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > ms) throw new Error(`timed out: ${label}`);
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}

/** Lets timers, the scheduler and animation frames run for `ms` */
export function settle(ms = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Runs `load` with no DOM global defined and returns what it returns */
export function loadServerHalf<T>(load: () => T): T {
  if (
    typeof (globalThis as any).window !== 'undefined' ||
    typeof (globalThis as any).document !== 'undefined'
  )
    throw new Error('loadServerHalf() needs a global scope without a DOM');
  jest.resetModules();
  return load();
}

const DEVTOOLS_HOOK = {
  supportsFiber: true,
  isDisabled: false,
  renderers: new Map(),
  inject: () => 1,
  onCommitFiberRoot() {},
  onCommitFiberUnmount() {},
  onPostCommitFiberRoot() {},
  onScheduleFiberRoot() {},
  checkDCE() {},
};

/** Creates a jsdom window, installs its globals, resets the module registry. Returns a teardown. */
export function installDom(): () => Promise<void> {
  const { JSDOM } = jest.requireActual('jsdom') as typeof import('jsdom');
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body></body></html>',
    { url: 'http://localhost/', pretendToBeVisual: true },
  );
  const { window } = dom;
  const g = globalThis as any;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const define = (key: string, value: unknown, force = false) => {
    if (!force && key in g) return;
    if (!saved.has(key))
      saved.set(key, Object.getOwnPropertyDescriptor(g, key));
    Object.defineProperty(g, key, {
      configurable: true,
      writable: true,
      value,
    });
  };
  define('window', window);
  define('document', window.document);
  // the inline scripts write `self.__RDC_STREAM__`; the ledger reads globalThis
  define('self', globalThis);
  // Node has its own versions; jsdom accepts only its own
  for (const key of ['Event', 'EventTarget', 'CustomEvent', 'navigator'])
    define(key, (window as any)[key], true);
  for (const key of Object.getOwnPropertyNames(window)) {
    if (key in g) continue;
    const value = (window as any)[key];
    define(
      key,
      typeof value === 'function' && !/^[A-Z]/.test(key) ?
        value.bind(window)
      : value,
    );
  }
  // the commit probe needs the hook before react-dom loads
  define('__REACT_DEVTOOLS_GLOBAL_HOOK__', { ...DEVTOOLS_HOOK });
  define('IS_REACT_ACT_ENVIRONMENT', false);
  // one document, one ledger
  delete g.__RDC_STREAM__;
  jest.resetModules();
  return async () => {
    // work React scheduled before an unmount still reads `window`
    await settle(30);
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(g, key, descriptor);
      else delete g[key];
    }
    delete g.__RDC_STREAM__;
    window.close();
  };
}
