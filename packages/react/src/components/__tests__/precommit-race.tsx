import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';

import {
  registerPrecommitRaceTests,
  type RaceHost,
} from './precommit-race.node-suite';

const host: RaceHost = {
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  createRenderer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);
    return {
      render(node) {
        root.render(node);
      },
      read() {
        return container.textContent ?? '';
      },
      unmount() {
        root.unmount();
        container.remove();
      },
    };
  },
};

registerPrecommitRaceTests(host);
