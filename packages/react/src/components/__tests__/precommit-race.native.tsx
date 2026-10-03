import type { ReactNode } from 'react';
import { Text } from 'react-native';
import TestRenderer from 'react-test-renderer';

import {
  registerPrecommitRaceTests,
  type RaceHost,
} from './precommit-race.node-suite';

const host: RaceHost = {
  Text: ({ children }: { children?: ReactNode }) => <Text>{children}</Text>,
  createRenderer() {
    let renderer: TestRenderer.ReactTestRenderer | undefined;
    return {
      render(node) {
        if (!renderer) renderer = TestRenderer.create(node);
        else renderer.update(node);
      },
      read() {
        return JSON.stringify(renderer?.toJSON() ?? '');
      },
      unmount() {
        renderer?.unmount();
      },
    };
  },
};

registerPrecommitRaceTests(host);
