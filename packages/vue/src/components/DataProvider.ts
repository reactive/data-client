import {
  initialState as defaultState,
  Controller as DataController,
  applyManager,
  initManager,
} from '@data-client/core';
import type { State, Manager, GCInterface } from '@data-client/core';
import { defineComponent, h, shallowRef } from 'vue';

import DataStore from './DataStore.js';
import { getDefaultManagers } from './getDefaultManagers';

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
    const ControllerCtor = props.Controller ?? DataController;

    // refs to keep identity stable
    const controllerRef = shallowRef<any>(
      new ControllerCtor({ gcPolicy: props.gcPolicy }),
    );
    const managersRef = shallowRef<Manager[]>(
      props.managers ?? getDefaultManagers(),
    );
    const initial = props.initialState ?? (defaultState as State<unknown>);

    // prepare init/cleanup runner (invoked in DataStore onMounted)
    const mgrEffect = initManager(
      managersRef.value,
      controllerRef.value,
      initial,
    );

    // build middleware
    const middlewares = applyManager(managersRef.value, controllerRef.value);

    return () =>
      h(
        DataStore as any,
        {
          mgrEffect,
          middlewares,
          initialState: initial,
          controller: controllerRef.value,
        },
        slots.default ? { default: () => slots.default!() } : undefined,
      );
  },
});
