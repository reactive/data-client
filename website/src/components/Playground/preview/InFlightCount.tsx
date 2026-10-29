import { actionTypes, type Manager } from '@data-client/react';
import { usePluralForm } from '@docusaurus/theme-common';
import { translate } from '@docusaurus/Translate';
import React, { useState } from 'react';

import styles from '../styles.module.css';

/** Counts the preview's requests in flight: one per endpoint key, from its
 * fetch until its response (or abort) lands. The manager sits before
 * NetworkManager, which consumes fetches; it writes straight to the badge,
 * since fetches dispatch while components render.
 *
 * Stays hidden until the first fetch, so a preview that never fetches shows
 * no badge. */
export function useInFlightCount(enabled: boolean) {
  // a page's locale never changes; keep the first label (see RenderCount)
  const { selectMessage } = usePluralForm();
  const [{ manager, attach }] = useState(() => {
    // each store counts its own (a Reset makes a new one); its middleware can
    // be built more than once, so a store's set is kept by its controller
    const stores = new WeakMap<object, Set<string>>();
    // the badge shows the store whose middleware was built last
    let newest = new Set<string>();
    let fetched = false;
    let span: HTMLSpanElement | null = null;
    const show = () => {
      if (!span || !fetched) return;
      span.textContent = selectMessage(
        newest.size,
        translate(
          {
            id: 'playground.inFlight',
            description: 'Plural forms, separated by |',
            message: '{count} fetch in flight|{count} fetches in flight',
          },
          { count: newest.size },
        ),
      );
      span.hidden = false;
    };
    const manager: Manager = {
      middleware: controller => {
        const own = stores.get(controller) ?? new Set<string>();
        stores.set(controller, own);
        newest = own;
        show();
        return next => action => {
          switch (action.type) {
            case actionTypes.FETCH:
              own.add(action.key);
              fetched = true;
              show();
              break;
            case actionTypes.SET_RESPONSE:
              if (own.delete(action.key)) show();
              break;
            case actionTypes.RESET:
              own.clear();
              show();
          }
          return next(action);
        };
      },
      cleanup() {
        // each store's set goes with its controller; the badge already shows
        // the newest
      },
    };
    // the first fetches dispatch while the badge itself first renders
    const attach = (el: HTMLSpanElement | null) => {
      span = el;
      show();
    };
    return { manager, attach };
  });
  if (!enabled) return {};
  const badge = (
    <span ref={attach} hidden role="status" className={styles.inFlightCount} />
  );
  return { manager, badge };
}
