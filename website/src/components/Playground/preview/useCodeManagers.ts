import { useCallback, useMemo } from 'react';

import ManagerHost, { managersVersion } from './managers';
import { previewScope } from './scope';
import transformCode from './transformCode';
import type { PreviewSnapshot } from './usePreviewReset';
import type { CodeDocument } from '../editor/codeModel';

/** Connects the preview's code to the managers it declares with
 * `getManagers()`: the code registers it with `host`, which builds each store's
 * managers from it.
 *
 * @param remount gives the store new managers, keeping its data
 * @returns `scope` and `transformCode` for react-live, `host` for the store
 */
export function useCodeManagers(
  documents: readonly CodeDocument[],
  remount: (snapshot: PreviewSnapshot) => void,
) {
  const version = useMemo(() => managersVersion(documents), [documents]);
  // outlives remounts, so a new store gets the last registered getManagers()
  const host = useMemo(() => new ManagerHost(remount), [remount]);
  const scope = useMemo(
    () => ({ ...previewScope, [REGISTER_MANAGERS]: host.register }),
    [host],
  );
  // changes only along with the code, so it never re-runs the code by itself
  const transformWithManagers = useCallback(
    (code: string) => transformCode(code) + managersTrailer(version),
    [version],
  );
  return { host, scope, transformCode: transformWithManagers };
}

/** Scope name the code's trailer calls; never typed by users */
const REGISTER_MANAGERS = '__registerManagers';

/** Appended to the preview's code: hands `getManagers()` (if the code defines
 * one) to the host. Only reached when the whole code ran, so code that fails
 * keeps the managers it had.
 *
 * @param version identifies the source of the documents `getManagers()` uses
 */
function managersTrailer(version: string) {
  return `\n;${REGISTER_MANAGERS}(typeof getManagers === 'function' ? getManagers : undefined, ${JSON.stringify(version)});`;
}
