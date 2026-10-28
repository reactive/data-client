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
    // each store (Reset remounts it) counts its own; the badge shows the newest
    const stores = new WeakMap<object, Set<string>>();
    let keys = new Set<string>();
    let badge: HTMLSpanElement | null = null;
    const show = (reveal = false) => {
      if (!badge || (badge.hidden && !reveal)) return;
      badge.textContent = selectMessage(
        keys.size,
        translate(
          {
            id: 'playground.inFlight',
            description: 'Plural forms, separated by |',
            message: '{count} fetch in flight|{count} fetches in flight',
          },
          { count: keys.size },
        ),
      );
      badge.hidden = false;
    };
    const manager: Manager = {
      middleware: controller => {
        const own = stores.get(controller) ?? new Set<string>();
        stores.set(controller, own);
        keys = own;
        show();
        return next => action => {
          switch (action.type) {
            case actionTypes.FETCH:
              own.add(action.key);
              show(true);
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
      // a Reset's new store has already taken the badge over
      cleanup() {
        show();
      },
    };
    // the first fetches dispatch while the badge itself first renders
    const attach = (span: HTMLSpanElement | null) => {
      badge = span;
      if (keys.size) show(true);
    };
    return { manager, attach };
  });
  if (!enabled) return {};
  const badge = (
    <span ref={attach} hidden role="status" className={styles.inFlightCount} />
  );
  return { manager, badge };
}
