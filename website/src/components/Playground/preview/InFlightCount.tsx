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
    const keys = new Set<string>();
    let badge: HTMLSpanElement | null = null;
    const show = () => {
      if (!badge) return;
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
      middleware: () => next => action => {
        switch (action.type) {
          case actionTypes.FETCH:
            keys.add(action.key);
            show();
            break;
          case actionTypes.SET_RESPONSE:
            if (keys.delete(action.key)) show();
            break;
          case actionTypes.RESET:
            keys.clear();
            show();
        }
        return next(action);
      },
      // a remounted store starts with nothing in flight
      cleanup() {
        keys.clear();
        show();
      },
    };
    // the first fetches dispatch while the badge itself first renders
    const attach = (span: HTMLSpanElement | null) => {
      badge = span;
      if (keys.size) show();
    };
    return { manager, attach };
  });
  if (!enabled) return {};
  const badge = (
    <span ref={attach} hidden role="status" className={styles.inFlightCount} />
  );
  return { manager, badge };
}
