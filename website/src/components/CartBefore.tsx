/* eslint-disable @docusaurus/no-untranslated-text -- the app's text, as the
   live demo's code (never translated) renders it beside this */
import React, { useState } from 'react';

import { type CartItemData, initialItems } from '../fixtures/cart';
import { CancelButton } from './Playground/DesignSystem/CancelButton';
import { formatters } from './Playground/DesignSystem/formatters';
// the demo's styles load with its preview's chunk; the replay shows (and is
// in the HTML) before that, and without it for crawlers
import './Playground/DesignSystem/design-system.css';

/** The v0.19 blog's cart demo as v0.18 showed it, for its playground's
 * `before` replay: the same markup, with the old Collection behavior. A
 * removed item's id stayed in the list (hidden while deleted), so pushing it
 * back showed it in its old place and again at the end */
export default function CartBefore() {
  // the list's ids, a removed one kept; and the one removed
  const [ids, setIds] = useState<string[]>(() => Object.keys(ITEMS));
  const [removed, setRemoved] = useState<string | null>(null);
  const shown = ids.filter(id => id !== removed);

  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Daily Grind</h1>
        <span className="meta">{shown.length} in cart</span>
      </header>
      <div className="list">
        {shown.map((id, i) => {
          const {
            product: { name, price },
            quantity,
          } = ITEMS[id];
          return (
            <div className="listItem" key={`${id}:${i}`}>
              <div>
                {name}
                <div className="meta">
                  {quantity} × {usd(price)}
                </div>
              </div>
              <span className="value">{usd(quantity * price)}</span>
              <CancelButton
                label={`Remove ${name}`}
                onClick={() => setRemoved(id)}
              />
            </div>
          );
        })}
      </div>
      {/* not the design system's `toast`: its toasts are module state the
          live app's <Toaster /> shows, so this one would show there too */}
      <div className="toaster" role="status">
        {removed ?
          <div className="toast" data-kind="info">
            {ITEMS[removed].product.name} removed
            <button
              type="button"
              onClick={() => {
                setIds(list => [...list, removed]);
                setRemoved(null);
              }}
            >
              Undo
            </button>
          </div>
        : null}
      </div>
    </>
  );
}

// the demo's own cart, as its fixtures serve it
const ITEMS: Record<string, CartItemData> = initialItems;

const usd = formatters.currency;
