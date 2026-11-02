import { useCallback, useMemo, useState } from 'react';

import ManagerHost, { managersVersion } from './managers';
import { previewScope } from './scope';
import transformCode, {
  documentLine,
  layoutOf,
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
  const layout = useMemo(() => layoutOf(documents), [documents]);
  // outlives remounts, so a new store gets the last registered getManagers()
  const host = useMemo(() => new ManagerHost(remount), [remount]);
  const [files] = useState(() => new RunningFiles(layout));
  const scope = useMemo(
    () => ({
      ...previewScope,
      [RUN_START]: files.start,
      [REGISTER_MANAGERS]: (
        getManagers: Parameters<ManagerHost['register']>[0],
        managersSource: string,
      ) => {
        files.ran();
        host.register(getManagers, managersSource);
      },
      [RUN_END]: files.end,
    }),
    [host, files],
  );
  // changes only along with the code, so it never re-runs the code by itself
  const transformWithManagers = useCallback(
    (code: string) =>
      // the try block is the scope block (see `scopeBlock`), opened on the
      // code's first line, so its lines keep their numbers
      `${RUN_START}(${JSON.stringify(layout)});try{${transformCode(code + managersTrailer(version))}\n}finally{${RUN_END}()}`,
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
  readonly ran = () => {
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
