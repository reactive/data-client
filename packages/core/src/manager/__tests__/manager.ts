import Controller from '../../controller/Controller';
import { Middleware } from '../../middlewareTypes';
import { ActionTypes } from '../../types';
import NetworkManager from '../NetworkManager';

const middleware: Middleware = new NetworkManager().getMiddleware();
it('middlewares should compose with non-rest-hooks middlewares', () => {
  type AnotherAction = {
    type: 'BOB';
    payload: any;
  };
  const dispatch = jest.fn(async (action: ActionTypes | AnotherAction) => {});
  const ctrl = new Controller({ dispatch });
  const API: typeof ctrl & { controller: typeof ctrl } = Object.create(ctrl, {
    controller: { value: ctrl },
  });
  type A = (typeof API)['dispatch'];
  let counter = 0;
  const nonRHMiddleware =
    <
      C extends {
        dispatch: (action: AnotherAction) => Promise<void>;
      },
    >(
      controller: C,
    ) =>
    (next: C['dispatch']): C['dispatch'] =>
    async (action: AnotherAction) => {
      next(action);
      counter++;
    };

  const [a, b] = [middleware(API), nonRHMiddleware(API)];
  const dispA = a(b(dispatch));
  const dispB = b(a(dispatch));
  expect(dispatch.mock.calls.length).toBe(0);
  dispA({ type: 'BOB' as const, payload: 5 });
  expect(dispatch.mock.calls.length).toBe(1);
  dispB({ type: 'BOB' as const, payload: 5 });
  expect(dispatch.mock.calls.length).toBe(2);
  expect(counter).toBe(2);
});
