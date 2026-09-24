import type { ReactElement, ReactNode } from 'react';
import * as ReactDOM from 'react-dom';

import { LegacyReact } from '../LegacyReact';
import {
  registerPrecommitRaceTests,
  type RaceHost,
  type RaceRenderer,
} from './precommit-race.node-suite';

// react-dom 17 has no `react-dom/client`, and React 19 types drop `render`
const legacyDOM = ReactDOM as unknown as {
  render(node: ReactElement, container: Element): void;
  unmountComponentAtNode(container: Element): boolean;
};

function createRoot(container: HTMLElement): Omit<RaceRenderer, 'read'> {
  if (LegacyReact) {
    return {
      render: node => legacyDOM.render(node, container),
      unmount: () => legacyDOM.unmountComponentAtNode(container),
    };
  }
  const client: typeof import('react-dom/client') = require('react-dom/client');
  return client.createRoot(container);
}

const host: RaceHost = {
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  createRenderer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
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
