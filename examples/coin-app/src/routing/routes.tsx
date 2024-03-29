import { Route } from '@anansi/router';
import { Controller } from '@data-client/react';
import { CurrencyResource } from 'resources/Currency';
import { StatsResource } from 'resources/Stats';
import { getTicker } from 'resources/Ticker';

import { lazyPage } from './lazyPage';

export const routes: Route<Controller>[] = [
  {
    name: 'Home',
    component: lazyPage('Home'),
    async resolveData(controller) {
      await Promise.allSettled([
        controller.fetchIfStale(CurrencyResource.getList),
        controller.fetchIfStale(StatsResource.getList),
      ]);
    },
  },
  {
    name: 'AssetDetail',
    component: lazyPage('AssetDetail'),
    async resolveData(controller, { id }) {
      const product_id = `${id}-USD`;
      await Promise.allSettled([
        controller.fetchIfStale(getTicker, { product_id }),
        controller.fetchIfStale(CurrencyResource.get, { id }),
        controller.fetchIfStale(StatsResource.get, { id: product_id }),
      ]);
    },
  },
];

export const namedPaths = {
  Home: '/',
  AssetDetail: '/asset/:id',
} as const;
