import type { DevToolsConfig, Manager } from '@data-client/core';

import {
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from '../managers/index.js';

/* istanbul ignore next */
/** Returns the default Managers used by DataProvider.
 *
 * @see https://dataclient.io/docs/api/getDefaultManagers
 */
let getDefaultManagers: ({
  devToolsManager,
  networkManager,
  subscriptionManager,
}?: GetManagersOptions) => Manager[] = ({
  networkManager,
  subscriptionManager = PollingSubscription,
} = {}) =>
  subscriptionManager === null ?
    [constructManager(NetworkManager, networkManager)]
  : [
      constructManager(NetworkManager, networkManager),
      constructManager(SubscriptionManager, subscriptionManager),
    ];
/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
  getDefaultManagers = ({
    devToolsManager,
    networkManager,
    subscriptionManager = PollingSubscription,
  }: GetManagersOptions = {}): Manager[] => {
    if (networkManager === null) {
      console.error('Disabling NetworkManager is not allowed.');
      networkManager = {};
    }
    const nm = constructManager(NetworkManager, networkManager);
    const managers: Manager[] = [nm];
    if (subscriptionManager !== null) {
      managers.push(constructManager(SubscriptionManager, subscriptionManager));
    }
    if (devToolsManager !== null) {
      managers.unshift(
        devToolsManager instanceof DevToolsManager ? devToolsManager : (
          new DevToolsManager(devToolsManager, nm.skipLogging.bind(nm))
        ),
      );
    }
    return managers;
  };
}
export { getDefaultManagers };

function constructManager<
  M extends { new (...args: any): Manager },
  O extends InstanceType<M> | ConstructorArgs<M>,
>(Mgr: M, optionOrInstance: O): InstanceType<M> {
  return optionOrInstance instanceof Mgr ? optionOrInstance : (
      (new Mgr(optionOrInstance) as any)
    );
}

export type GetManagersOptions = {
  devToolsManager?: DevToolsManager | DevToolsConfig | null;
  networkManager?: NetworkManager | ConstructorArgs<typeof NetworkManager>;
  subscriptionManager?:
    | SubscriptionManager
    | ConstructorArgs<typeof SubscriptionManager>
    | null;
};

export type ConstructorArgs<T extends { new (...args: any): any }> =
  T extends { new (options: infer O): any } ? O : never;
