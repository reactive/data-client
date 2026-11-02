import { useCallback, useMemo, useRef, useState } from 'react';

import ManagerHost, { managersVersion } from './managers';
import { previewScope } from './scope';
import { scopeBlock } from './transformCode';
import type { PreviewSnapshot } from './usePreviewReset';
import type { CodeDocument } from '../editor/codeModel';

/** Connects the preview's code to the managers it declares with
 * `getManagers()`: the code registers it with `host`, which builds each store's
 * managers from it.
 *
 * @param remount gives the store new managers, keeping its data
 * @returns `scope` and `transformCode` for react-live, `host` for the store,
 * `ran` the files of the code that last ran to its end
 */
export function useCodeManagers(
  documents: readonly CodeDocument[],
  remount: (snapshot: PreviewSnapshot) => void,
) {
  const version = useMemo(() => managersVersion(documents), [documents]);
  // outlives remounts, so a new store gets the last registered getManagers()
  const host = useMemo(() => new ManagerHost(remount), [remount]);
  // the files of the last code that ran to its end: code that fails keeps
  // running the code before it, whose stack lines map into its own files
  const ran = useRef(documents);
  const latest = useRef(documents);
  latest.current = documents;
  // the files each transformed code came from, until it runs
  const [transformed] = useState(
    () => new Map<number, readonly CodeDocument[]>(),
  );
  const scope = useMemo(
    () => ({
      ...previewScope,
      [REGISTER_MANAGERS]: (
        getManagers: Parameters<ManagerHost['register']>[0],
        version: string,
        run: number,
      ) => {
        const files = transformed.get(run);
        if (files) ran.current = files;
        for (const older of transformed.keys())
          if (older <= run) transformed.delete(older);
        host.register(getManagers, version);
      },
    }),
    [host, transformed],
  );
  // changes only along with the code, so it never re-runs the code by itself
  const transformWithManagers = useCallback(
    (code: string) => {
      // react-live transforms the code as it commits, so `latest` is its files
      const run = nextRun++;
      transformed.set(run, latest.current);
      return scopeBlock(code + managersTrailer(version, run));
    },
    [version, transformed],
  );
  return { host, scope, transformCode: transformWithManagers, ran };
}

/** Tells one transformed code from the next */
let nextRun = 0;

/** Scope name the code's trailer calls; never typed by users */
const REGISTER_MANAGERS = '__registerManagers';

/** Appended to the preview's code: hands `getManagers()` (if the code defines
 * one) to the host. Only reached when the whole code ran, so code that fails
 * keeps the managers it had.
 *
 * @param version identifies the source of the documents `getManagers()` uses
 * @param run identifies the transform, so the files that ran are known
 */
function managersTrailer(version: string, run: number) {
  return `\n;${REGISTER_MANAGERS}(typeof getManagers === 'function' ? getManagers : undefined, ${JSON.stringify(version)}, ${run});`;
}
