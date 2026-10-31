import React, { useState } from 'react';

import type SchemaRegistry from '../store/schemaRegistry';
import StorePanel from '../store/StorePanel';
import {
  DrawerTabs,
  InspectorContext,
  useStoreOpen,
  type InspectorOpen,
} from '../StoreToggle';

let nextGroup = 0;

/** The Store panel under its drawer's tabs, Actions and Store (role `tab`),
 * as the row layout draws them, with the quick look their hover opens. Shut,
 * the panel stays (it shows the tab last open) */
export function InspectedPanel({
  registry,
  history,
  defaultOpen = 'store',
}: {
  registry: SchemaRegistry;
  history: number;
  defaultOpen?: InspectorOpen;
}) {
  const [group] = useState(() => `inspected${nextGroup++}`);
  const [open, toggle, , , , inspector] = useStoreOpen(group, defaultOpen);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <InspectorContext.Provider value={inspector}>
      <DrawerTabs
        open={open}
        inspector={inspector}
        onToggle={toggle}
        controls={group}
      />
      <div ref={setHost} id={group}>
        <StorePanel registry={registry} history={history} lookHost={host} />
      </div>
    </InspectorContext.Provider>
  );
}
