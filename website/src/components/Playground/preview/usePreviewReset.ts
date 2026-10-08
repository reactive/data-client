import type { State } from '@data-client/react';
import { useCallback, useRef, useState } from 'react';

/** What a preview needs to come back as it was: the store and the simulated server */
export interface PreviewSnapshot {
  state: State<unknown>;
  interceptorData: unknown;
}

interface PreviewStore {
  /** Remounts the preview (and its store) when it changes */
  key: number;
  /** The Actions log history this store writes to: a fresh store starts its
   * own (its first key); a restored one continues the one it was saved from */
  history: number;
  /** Code this store last rendered cleanly under (or was created with) */
  code: string;
  restored?: PreviewSnapshot;
  /** While trying a fresh store: the store it replaced, restored if the error persists */
  replaced?: { snapshot: PreviewSnapshot; code: string; history: number };
  /** Set once the preview renders without error; spent by an automatic reset */
  canAutoReset: boolean;
}

/** Store lifecycle of one live preview.
 *
 * An edit can leave data the old code wrote unreadable by the new code (e.g. a
 * changed `Entity.key`). When a render error follows an edit, the preview
 * retries once with a fresh store. If the error persists, the store was not the
 * cause, so the old store comes back and no retry happens until the preview
 * works again (typing through a typo retries at most once).
 */
export function usePreviewReset(code: string) {
  const [store, setStore] = useState<PreviewStore>({
    key: 0,
    history: 0,
    code,
    canAutoReset: false,
  });
  const codeRef = useRef(code);
  codeRef.current = code;

  const reset = useCallback(
    () =>
      setStore(s => ({
        key: s.key + 1,
        history: s.key + 1,
        code: codeRef.current,
        canAutoReset: false,
      })),
    [],
  );

  const onRenderError = useCallback(
    (errorCode: string, snapshot: PreviewSnapshot) =>
      setStore(s => {
        if (s.replaced && s.code === errorCode)
          return {
            key: s.key + 1,
            history: s.replaced.history,
            code: s.replaced.code,
            restored: s.replaced.snapshot,
            canAutoReset: false,
          };
        if (s.code === errorCode || !s.canAutoReset) return s;
        return {
          key: s.key + 1,
          history: s.key + 1,
          code: errorCode,
          replaced: { snapshot, code: s.code, history: s.history },
          canAutoReset: false,
        };
      }),
    [],
  );

  // A clean render of other code ends any retry: its old store no longer applies.
  const onHealthy = useCallback(
    (healthyCode: string) =>
      setStore(s => {
        if (s.code !== healthyCode)
          return {
            ...s,
            code: healthyCode,
            replaced: undefined,
            canAutoReset: true,
          };
        return s.canAutoReset ? s : { ...s, canAutoReset: true };
      }),
    [],
  );

  // Once the user interacts with the fresh store, its errors are their own.
  const onInteract = useCallback(
    () => setStore(s => (s.replaced ? { ...s, replaced: undefined } : s)),
    [],
  );

  return {
    key: store.key,
    history: store.history,
    /** The only other history that can still come back */
    replacedHistory: store.replaced?.history,
    restored: store.restored,
    reset,
    onRenderError,
    onHealthy,
    onInteract,
  };
}
