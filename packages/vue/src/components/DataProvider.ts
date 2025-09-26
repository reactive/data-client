import { Controller as DataController } from '@data-client/core';
import type { State, Manager, GCInterface } from '@data-client/core';
import { defineComponent } from 'vue';

import { provideDataClient } from '../providers/provideDataClient.js';

export interface ProviderProps {
  managers?: Manager[];
  initialState?: State<unknown>;
  Controller?: typeof DataController;
  gcPolicy?: GCInterface;
}

export default defineComponent<ProviderProps>({
  name: 'DataProvider',
  props: ['managers', 'initialState', 'Controller', 'gcPolicy'] as any,
  setup(props, { slots }) {
    provideDataClient({
      Controller: props.Controller,
      gcPolicy: props.gcPolicy,
      initialState: props.initialState,
      managers: props.managers,
    });
    return () => (slots.default ? slots.default() : null);
  },
});
