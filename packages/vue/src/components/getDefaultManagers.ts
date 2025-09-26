import type { DevToolsConfig, Manager } from '@data-client/core';
import {
  NetworkManager,
  SubscriptionManager,
  PollingSubscription,
  DevToolsManager,
} from '@data-client/core';

/* istanbul ignore next */
/** Returns the default Managers used by DataProvider. */
let getDefaultManagers: (options?: GetManagersOptions) => Manager[] = (
  options = {},
) => {
  const { networkManager, subscriptionManager = PollingSubscription } = options;
  if (subscriptionManager === null) {
    return [constructManager(NetworkManager, networkManager ?? ({} as any))];
  }
  return [
    constructManager(NetworkManager, networkManager ?? ({} as any)),
    constructManager(SubscriptionManager, subscriptionManager),
  ];
};
/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
  getDefaultManagers = (options: GetManagersOptions = {}): Manager[] => {
    const {
      devToolsManager,
      networkManager,
      subscriptionManager = PollingSubscription,
    } = options;
    if (networkManager === null) {
      console.error('Disabling NetworkManager is not allowed.');
      // fall back to default options
    }
    const nm = constructManager(NetworkManager, networkManager ?? ({} as any));
    const managers: Manager[] = [nm];
    if (subscriptionManager !== null) {
      managers.push(constructManager(SubscriptionManager, subscriptionManager));
    }
    if (devToolsManager !== null) {
      let dtm: DevToolsManager;
      if (devToolsManager instanceof DevToolsManager) {
        dtm = devToolsManager;
      } else {
        dtm = new DevToolsManager(
          devToolsManager as any,
          nm.skipLogging.bind(nm),
        );
      }
      managers.unshift(dtm);
    }
    return managers;
  };
}
export { getDefaultManagers };

function constructManager<M extends { new (...args: any): Manager }>(
  Mgr: M,
  optionOrInstance: InstanceType<M> | ConstructorArgs<M>,
): InstanceType<M> {
  if (optionOrInstance instanceof Mgr) {
    return optionOrInstance as InstanceType<M>;
  }
  return new Mgr(optionOrInstance as any) as InstanceType<M>;
}

export type GetManagersOptions = {
  devToolsManager?: DevToolsManager | DevToolsConfig | null;
  networkManager?:
    | NetworkManager
    | ConstructorArgs<typeof NetworkManager>
    | null;
  subscriptionManager?:
    | SubscriptionManager
    | ConstructorArgs<typeof SubscriptionManager>
    | null;
};

export type ConstructorArgs<T extends { new (...args: any): any }> =
  T extends new (options: infer O) => any ? O : never;
