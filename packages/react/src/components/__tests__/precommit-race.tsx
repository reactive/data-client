import type { ReactElement, ReactNode } from 'react';

import { LegacyReact } from '../LegacyReact';
import {
  registerPrecommitRaceTests,
  type RaceHost,
  type RaceRenderer,
} from './precommit-race.node-suite';

function createRoot(container: HTMLElement): Omit<RaceRenderer, 'read'> {
  if (LegacyReact) {
    // react-dom 17 has no `react-dom/client`, and React 19 types drop `render`
    const dom: {
      render(node: ReactElement, container: Element): void;
      unmountComponentAtNode(container: Element): boolean;
    } = require('react-dom');
    return {
      render: node => dom.render(node, container),
      unmount: () => dom.unmountComponentAtNode(container),
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
