import {
  floodSpouts,
  documentSpout,
  dataClientSpout,
  routerSpout,
  JSONSpout,
  appSpout,
  antdSpout,
  navigatorSpout,
} from '@anansi/core';
import { useController } from '@data-client/react';

import app from '@/app';
import { getManagers } from '@/app/RootProvider';

import { createRouter } from './routing';

const spouts = documentSpout({ title: 'Github App' })(
  antdSpout()(
    JSONSpout()(
      navigatorSpout()(
        dataClientSpout({ getManagers })(
          routerSpout({ useResolveWith: useController, createRouter })(
            appSpout(app),
          ),
        ),
      ),
    ),
  ),
);

export default floodSpouts(spouts);
