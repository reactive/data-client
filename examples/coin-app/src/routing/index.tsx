import { RouteController } from '@anansi/router';
import NotFound from 'components/NotFound';
import type { History } from 'history';

import { routes, namedPaths } from './routes';

export function createRouter(history: History) {
  return new RouteController({
    history,
    namedPaths,
    routes,
    notFound: { component: NotFound },
  });
}
