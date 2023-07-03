import { SET_TYPE } from '../actionTypes.js';
import Controller from '../controller/Controller.js';
import { UnknownError } from '../index.js';
import { ActionTypes, Manager } from '../types.js';

/** Handling network unauthorized indicators like HTTP 401
 *
 * @see https://dataclient.io/docs/api/LogoutManager
 */
export default class LogoutManager implements Manager {
  protected declare middleware: Middleware;

  constructor({ handleLogout, shouldLogout }: Props = {}) {
    if (handleLogout) this.handleLogout = handleLogout;
    if (shouldLogout) this.shouldLogout = shouldLogout;
    this.middleware = controller => next => async action => {
      await next(action);
      if (
        action.type === SET_TYPE &&
        action.error &&
        this.shouldLogout(action.payload)
      ) {
        this.handleLogout(controller);
      }
    };
  }

  cleanup() {}

  getMiddleware() {
    return this.middleware;
  }

  protected shouldLogout(error: UnknownError) {
    // 401 indicates reauthorization is needed
    return error.status === 401;
  }

  handleLogout(controller: Controller<Dispatch>) {
    controller.resetEntireStore();
  }
}

type Dispatch = (value: ActionTypes) => Promise<void>;

// this further restricts the types to be future compatible
export type Middleware = <C extends Controller<Dispatch>>(
  controller: C,
) => (next: C['dispatch']) => C['dispatch'];

type HandleLogout = (controller: Controller<Dispatch>) => void;

interface Props {
  handleLogout?: HandleLogout;
  shouldLogout?: (error: UnknownError) => boolean;
}
