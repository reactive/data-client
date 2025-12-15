import {
  floodSpouts,
  documentSpout,
  dataClientSpout,
  routerSpout,
  JSONSpout,
  appSpout,
  navigatorSpout,
} from '@anansi/core';
// this is just to make it work with older typescript versions in our tests
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { antdSpout } from '@anansi/core/antd';
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
