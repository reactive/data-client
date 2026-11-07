// Renders a hook under @data-client/react/redux's ExternalDataProvider and
// reports whether the hook gets that provider's controller. Run by run.sh from
// the folder `yarn check:package-exports` unpacks the packed packages into.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let failed = false;
for (const call of ['import', 'require']) {
  const load = call === 'import' ? s => import(s) : async s => require(s);
  const core = await load('@data-client/core');
  const { useController } = await load('@data-client/react');
  const { prepareStore, ExternalDataProvider } = await load(
    '@data-client/react/redux',
  );
  const { createElement } = await load('react');
  const { renderToString } = await load('react-dom/server');

  const { store, selector, controller } = prepareStore(
    core.initialState,
    () => [new core.NetworkManager()],
    core.Controller,
    {},
    [],
  );
  let seen;
  function Probe() {
    seen = useController();
    return null;
  }
  renderToString(
    createElement(
      ExternalDataProvider,
      { store, selector, controller },
      createElement(Probe),
    ),
  );
  const ok = seen === controller;
  if (!ok) failed = true;
  console.log(
    `${ok ? 'pass' : 'FAIL'} ${call}: useController() ${ok ? 'is' : 'is not'} the redux provider's controller`,
  );
}
process.exit(failed ? 1 : 0);
