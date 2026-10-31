import react, { JSX, ComponentProps } from 'react';
import { Controller, Manager, State, ActionTypes, GCInterface } from '@data-client/core';

declare const CATCH_UP = "rdc/catchup";
interface ClientStoreOptions {
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: new (props: {
        gcPolicy: GCInterface;
    }) => Controller;
    gcPolicy?: GCInterface;
}
/** A DataProvider store that lives outside React
 *
 * React discards a render that never commits, along with anything it created.
 * This store owns the Controller and managers, and reduces actions itself until
 * a DataProvider commits, so the provider that commits starts from them.
 *
 * Create it once per client, outside any component, and pass it to `<DataProvider store>`.
 * When rendering on a server, create one per request; a module-level store would be
 * shared by every request.
 * @see https://dataclient.io/docs/api/ClientStore
 */
declare class ClientStore {
    readonly controller: Controller;
    readonly managers: Manager[];
    readonly reducer: (state: State<unknown>, action: ActionTypes | CatchUpAction) => State<unknown>;
    protected sinks: Set<Sink>;
    protected state: State<unknown>;
    protected rendered: boolean;
    protected waiting: (() => void)[];
    constructor({ managers, initialState, Controller, gcPolicy, }?: ClientStoreOptions);
    /** State of the first committed DataProvider, or this store's own while none is committed
     *
     * Managers see committed state, as they do without a store.
     */
    getState: () => State<unknown>;
    protected reduce: (action: ActionTypes) => Promise<void>;
    protected attach(sink: Sink): () => void;
    /** DataProvider's state; starts from this store and receives its actions once committed */
    useState(): State<unknown>;
}
interface Sink {
    dispatch: (action: ActionTypes | CatchUpAction) => Promise<void>;
    getState: () => State<unknown>;
}
interface CatchUpAction {
    type: typeof CATCH_UP;
    state: State<unknown>;
}

type DevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

type ProviderProps$1 = {
    children: react.ReactNode;
    devButton?: DevToolsPosition | null | undefined;
} & ({
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: new (props: {
        gcPolicy: GCInterface;
    }) => Controller;
    gcPolicy?: GCInterface;
    store?: undefined;
} | {
    /** Store created outside React; it owns the managers, Controller and state
     * @see https://dataclient.io/docs/api/ClientStore
     */
    store: ClientStore;
    managers?: undefined;
    initialState?: undefined;
    Controller?: undefined;
    gcPolicy?: undefined;
});
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
declare function DataProvider$1({ children, managers, gcPolicy, initialState, Controller, devButton, store, }: ProviderProps$1): JSX.Element;

declare function DataProvider({ children, ...props }: ProviderProps): React.ReactElement;
type ProviderProps = Omit<Partial<ComponentProps<typeof DataProvider$1>>, 'initialState' | 'store'> & {
    children: React.ReactNode;
};

export { DataProvider };
