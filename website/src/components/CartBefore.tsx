/* eslint-disable @docusaurus/no-untranslated-text -- the app's text, as the
   live demo's code (never translated) renders it beside this */
import React, { useState } from 'react';

import { type CartItemData, initialItems } from '../fixtures/cart';
import { Reorder, useReorderItem } from './motion';
import { CancelButton } from './Playground/DesignSystem/CancelButton';
import { formatters } from './Playground/DesignSystem/formatters';
import { ToastList, ToastView } from './Playground/DesignSystem/Toaster';

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
        <Reorder layoutDependency={shown}>
          {rowKeys(shown).map((key, i) => (
            <CartRow
              key={key}
              rowKey={key}
              id={shown[i]}
              onRemove={() => setRemoved(shown[i])}
            />
          ))}
        </Reorder>
      </div>
      {/* not the design system's `toast`: its toasts are module state the
          live app's <Toaster /> shows, so this one would show there too */}
      <ToastList layoutDependency={removed}>
        {removed ?
          <ToastView
            id={removed}
            kind="info"
            message={`${ITEMS[removed].product.name} removed`}
            action={{
              label: 'Undo',
              onClick: () => {
                setIds(list => [...list, removed]);
                setRemoved(null);
              },
            }}
          />
        : null}
      </ToastList>
    </>
  );
}

function CartRow({
  rowKey,
  id,
  onRemove,
}: {
  rowKey: string;
  id: string;
  onRemove: () => void;
}) {
  const {
    product: { name, price },
    quantity,
  } = ITEMS[id];
  return (
    <div className="listItem" ref={useReorderItem(rowKey)}>
      <div>
        {name}
        <div className="meta">
          {quantity} × {usd(price)}
        </div>
      </div>
      <span className="value">{usd(quantity * price)}</span>
      <CancelButton label={`Remove ${name}`} onClick={onRemove} />
    </div>
  );
}

/** Each row's key: its id, and its count for a repeat ("mug", then
 * "mug 2"), so the rows the list kept keep theirs */
function rowKeys(ids: string[]) {
  const seen = new Map<string, number>();
  return ids.map(id => {
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    return n === 1 ? id : `${id} ${n}`;
  });
}

// the demo's own cart, as its fixtures serve it
const ITEMS: Record<string, CartItemData> = initialItems;

const usd = formatters.currency;
