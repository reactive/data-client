// this is just to make it work with older typescript versions in our tests
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { antdSpout } from '@anansi/core/antd';
import {
  laySpouts,
  documentSpout,
  dataClientSpout,
  prefetchSpout,
  routerSpout,
  JSONSpout,
  appSpout,
  navigatorSpout,
} from '@anansi/core/server';
import { useController } from '@data-client/react';

import app from '@/app';
import { getManagers } from '@/app/RootProvider';

import { createRouter } from './routing';

const csPolicy = {
  'base-uri': "'self'",
  'object-src': "'none'",
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'unsafe-inline'", "'self'"],
};

const spouts = prefetchSpout('controller')(
  // this is just to make it work with older typescript versions in our tests
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  documentSpout({ title: 'Github App', lang: 'en', csPolicy })(
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
  ),
);

export default laySpouts(spouts);
