import { lazy, Route } from '@anansi/router';
import { Controller } from '@data-client/react';
import { CurrencyResource } from 'resources/Currency';
import { StatsResource } from 'resources/Stats';
import { getTicker } from 'resources/Ticker';

const lazyPage = (pageName: string) =>
  lazy(
    () =>
      import(
        /* webpackChunkName: '[request]', webpackPrefetch: true */ `pages/${pageName}`
      ),
  );

export const namedPaths = {
  Home: '/',
  AssetDetail: '/asset/:id',
} as const;

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
      await controller.fetchIfStale(getTicker, { product_id });
    },
  },
];
