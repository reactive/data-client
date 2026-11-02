/* eslint-disable @docusaurus/no-untranslated-text -- the app's text, as the
   live demo's code (never translated) renders it beside this */
import React, { useState } from 'react';

import { CancelButton } from './Playground/DesignSystem/CancelButton';

/** The v0.19 blog's cart demo as v0.18 showed it, for its playground's
 * `before` replay: the same markup, with the old Collection behavior. A
 * removed item's id stayed in the list (hidden while deleted), so pushing it
 * back showed it in its old place and again at the end */
export default function CartBefore() {
  // the list's ids, a removed one kept; and the one removed
  const [ids, setIds] = useState(['house-blend', 'mug', 'filters']);
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
          const { name, price, quantity } = ITEMS[id];
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
      <div className="toaster" role="status">
        {removed ?
          <div className="toast" data-kind="info">
            {ITEMS[removed].name} removed
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

const ITEMS: Record<string, { name: string; price: number; quantity: number }> =
  {
    'house-blend': { name: 'House blend', price: 16, quantity: 2 },
    mug: { name: 'Ceramic mug', price: 12, quantity: 1 },
    filters: { name: 'Paper filters', price: 4, quantity: 1 },
  };

const usd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
