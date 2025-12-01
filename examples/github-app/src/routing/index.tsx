import { RouteController } from '@anansi/router';
import type { History } from 'history';

import { routes, namedPaths } from './routes';

export function createRouter(history: History) {
  return new RouteController({
    history,
    namedPaths,
    routes,
    notFound: { component: () => <>Not Found</> },
  });
}
