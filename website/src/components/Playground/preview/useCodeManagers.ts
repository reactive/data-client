import { useCallback, useMemo, useState } from 'react';

import ManagerHost, { managersVersion } from './managers';
import { previewScope } from './scope';
import {
  documentLine,
  layoutOf,
  scopeBlock,
  type DocumentSpan,
} from './transformCode';
import type { PreviewSnapshot } from './usePreviewReset';
import type { CodeDocument } from '../editor/codeModel';

/** Connects the preview's code to the managers it declares with
 * `getManagers()`: the code registers it with `host`, which builds each store's
 * managers from it.
 *
 * @param remount gives the store new managers, keeping its data
 * @returns `scope` and `transformCode` for react-live, `host` for the store,
 * `locate` where a line of the running code is in its files
 */
export function useCodeManagers(
  documents: readonly CodeDocument[],
  remount: (snapshot: PreviewSnapshot) => void,
) {
  const version = useMemo(() => managersVersion(documents), [documents]);
  // a string, so equal files keep the transform the same
  const layout = useMemo(
    () => JSON.stringify(layoutOf(documents)),
    [documents],
  );
  // outlives remounts, so a new store gets the last registered getManagers()
  const host = useMemo(() => new ManagerHost(remount), [remount]);
  const [files] = useState(() => new RunningFiles(layoutOf(documents)));
  const scope = useMemo(
    () => ({
      ...previewScope,
      [RUN_START]: files.start,
      [REGISTER_MANAGERS]: (
        getManagers: Parameters<ManagerHost['register']>[0],
        codeVersion: string,
      ) => {
        files.complete();
        host.register(getManagers, codeVersion);
      },
      [RUN_END]: files.end,
    }),
    [host, files],
  );
  // changes only along with the code, so it never re-runs the code by itself
  const transformWithManagers = useCallback(
    (code: string) =>
      // the scope block is the try's, opened on the code's first line
      `${RUN_START}(${layout});try${scopeBlock(code + managersTrailer(version))}finally{${RUN_END}()}`,
    [version, layout],
  );
  return {
    host,
    scope,
    transformCode: transformWithManagers,
    locate: files.locate,
  };
}

/** The files of the code that runs: the code evaluating now, else the last
 * code that ran to its end. Code that fails keeps running the code before
 * it, whose stack lines are in its own files */
class RunningFiles {
  private last: readonly DocumentSpan[];
  private running: readonly DocumentSpan[] | undefined;

  constructor(layout: readonly DocumentSpan[]) {
    this.last = layout;
  }

  /** The code of `layout`'s files starts evaluating */
  readonly start = (layout: readonly DocumentSpan[]) => {
    this.running = layout;
  };

  /** The evaluating code ran to its end */
  readonly complete = () => {
    if (this.running) this.last = this.running;
  };

  /** The evaluating code is done, run to its end or not */
  readonly end = () => {
    this.running = undefined;
  };

  /** Where line `line` of the code that runs is in its files */
  readonly locate = (line: number) =>
    documentLine(this.running ?? this.last, line);
}

/** Scope names the transformed code calls; never typed by users */
const RUN_START = '__runStart';
const REGISTER_MANAGERS = '__registerManagers';
const RUN_END = '__runEnd';

/** Appended to the preview's code: hands `getManagers()` (if the code defines
 * one) to the host. Only reached when the whole code ran, so code that fails
 * keeps the managers it had.
 *
 * @param version identifies the source of the documents `getManagers()` uses
 */
function managersTrailer(version: string) {
  return `\n;${REGISTER_MANAGERS}(typeof getManagers === 'function' ? getManagers : undefined, ${JSON.stringify(version)});`;
}
