import { SET_RESPONSE_TYPE } from '../actionTypes.js';
import type Controller from '../controller/Controller.js';
import { UnknownError } from '../index.js';
import type { Manager, Middleware } from '../types.js';

/** Handling network unauthorized indicators like HTTP 401
 *
 * @see https://dataclient.io/docs/api/LogoutManager
 */
export default class LogoutManager implements Manager {
  constructor({ handleLogout, shouldLogout }: Props = {}) {
    if (handleLogout) this.handleLogout = handleLogout;
    if (shouldLogout) this.shouldLogout = shouldLogout;
  }

  middleware: Middleware = controller => next => async action => {
    await next(action);
    if (
      action.type === SET_RESPONSE_TYPE &&
      action.error &&
      this.shouldLogout(action.response)
    ) {
      this.handleLogout(controller);
    }
  };

  cleanup() {}

  protected shouldLogout(error: UnknownError) {
    // 401 indicates reauthorization is needed
    return error.status === 401;
  }

  handleLogout(controller: Controller) {
    controller.resetEntireStore();
  }
}

type HandleLogout = (controller: Controller) => void;

interface Props {
  handleLogout?: HandleLogout;
  shouldLogout?: (error: UnknownError) => boolean;
}
