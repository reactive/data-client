import {
  getDefaultManagers,
  NetworkManager,
  type Controller,
  type Manager,
} from '@data-client/react';

import { takeSnapshot, type PreviewSnapshot } from './usePreviewReset';
import type { CodeDocument } from '../editor/codeModel';
import { declarationsIn } from '../editor/declarations';

/** Hash of the documents `getManagers()` depends on. Editing them gives the
 * store new managers; other edits keep them. */
export function managersVersion(documents: readonly CodeDocument[]): string {
  let hash = 0;
  for (const value of managerSources(documents.map(({ value }) => value)))
    for (let i = 0; i < value.length; i++)
      hash = (Math.imul(hash, 31) + value.charCodeAt(i)) | 0;
  return hash.toString(36);
}

/** The source defining `getManagers()`, and those declaring a name it (or
 * another of them) uses, such as a Manager class in its own file. In
 * document order, so moving code between documents changes the version. */
function managerSources(sources: readonly string[]): string[] {
  const used = new Set(
    sources.filter(value => DEFINES_GET_MANAGERS.test(value)),
  );
  for (const user of used) {
    for (const value of sources) {
      if (!used.has(value) && declaresNameUsedBy(value, user)) used.add(value);
    }
  }
  return sources.filter(value => used.has(value));
}

function declaresNameUsedBy(source: string, user: string): boolean {
  for (const { name } of declarationsIn(source)) {
    const escaped = name.replace(/\$/g, '\\$');
    if (new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(user)) return true;
  }
  return false;
}
const DEFINES_GET_MANAGERS = /\bfunction\s+getManagers\b|\bgetManagers\s*[:=]/;

/** Managers a playground's code declares with `getManagers()`, the same
 * function a real app passes to `<DataProvider managers>`.
 *
 * DataProvider reads its managers once, so registering a new version calls
 * `onChange` with the store's data, to remount it. react-live renders the new
 * code's element in the same batch, so it never runs against the old store.
 * Edits elsewhere only swap in the newest function for the next store, so open
 * sockets stay open while typing in other files.
 */
export default class ManagerHost {
  /** Latest `getManagers` the code registered */
  protected getManagers?: () => Manager[];
  /** `managersVersion()` of the code that last registered */
  protected version = managersVersion([]);
  /** The current store's (MockResolver's) controller */
  protected controller?: Controller;
  /** A user manager threw; shown until the next store */
  error?: unknown;
  protected listeners = new Set<() => void>();

  constructor(protected onChange: (snapshot: PreviewSnapshot) => void) {}

  register = (getManagers: (() => Manager[]) | undefined, version: string) => {
    this.getManagers = getManagers;
    if (version === this.version) return;
    this.version = version;
    if (this.controller) this.onChange(takeSnapshot(this.controller));
  };

  /** Called by the current store, so a new version can carry its data over */
  attach = (controller: Controller) => {
    this.controller = controller;
  };

  /** Managers for a new store: the code's, or the defaults. `network` is
   * among them (the code's own, or one added for it). `reportFor` says
   * where a manager's errors go: the code's are guarded (`wrapManager`
   * skips a step that throws and reports it here); the library's aren't */
  create() {
    this.error = undefined;
    const declared = this.declared();
    let managers = declared ?? getDefaultManagers({ devToolsManager: null });
    let network = managers.find(
      (manager): manager is NetworkManager => manager instanceof NetworkManager,
    );
    // DataProvider warns about this; keep the preview working meanwhile
    if (!network) managers = [...managers, (network = new NetworkManager())];
    const reportFor = (manager: Manager) =>
      declared?.includes(manager) ? this.report : undefined;
    return { managers, network, reportFor };
  }

  /** What the code's `getManagers()` returns, if it returns managers */
  protected declared(): Manager[] | undefined {
    try {
      const managers = this.getManagers?.();
      if (Array.isArray(managers)) return managers;
    } catch (error) {
      // called while rendering the new store: no one to notify yet
      console.error(error);
      this.error = error;
    }
  }

  /** For `useSyncExternalStore` of `error` */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  protected report = (error: unknown) => {
    console.error(error);
    this.error = error;
    // middleware may run while the store renders
    queueMicrotask(() => this.listeners.forEach(listener => listener()));
  };
}
