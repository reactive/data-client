import react, { JSX, ComponentProps } from 'react';
import { Manager, Controller, State, ActionTypes, GCInterface, Middleware } from '@data-client/core';

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
 * Results that settle in that window still reduce into this store, and the
 * DataProvider that commits starts from them.
 *
 * Create it once, outside any component, and pass it to `<DataProvider store>`.
 * @see https://dataclient.io/docs/api/ClientStore
 */
declare class ClientStore implements Manager {
    readonly controller: Controller;
    readonly managers: Manager[];
    readonly reducer: (state: State<unknown>, action: ActionTypes | CatchUpAction) => State<unknown>;
    /** The latest state while no DataProvider is mounted */
    state: State<unknown>;
    protected mounted: boolean;
    protected pending: ActionTypes[];
    protected counts: WeakMap<State<unknown>, number>;
    protected waiting: (() => void)[];
    constructor({ managers, initialState, Controller, gcPolicy, }?: ClientStoreOptions);
    middleware: Middleware;
    /** Called with the state the mounted DataProvider started from */
    init(seed: State<unknown>): void;
    cleanup(): void;
}
interface CatchUpAction {
    type: typeof CATCH_UP;
    actions: ActionTypes[];
}

type DevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface ProviderProps$1 {
    children: react.ReactNode;
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: new (props: {
        gcPolicy: GCInterface;
    }) => Controller;
    gcPolicy?: GCInterface;
    devButton?: DevToolsPosition | null | undefined;
    /** Store created outside React; its managers, Controller and state replace those props
     * @see https://dataclient.io/docs/api/ClientStore
     */
    store?: ClientStore;
}
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
declare function DataProvider$1({ children, managers, gcPolicy, initialState, Controller, devButton, store, }: ProviderProps$1): JSX.Element;

declare function DataProvider({ children, ...props }: ProviderProps): React.ReactElement;
type ProviderProps = Omit<Partial<ComponentProps<typeof DataProvider$1>>, 'initialState'> & {
    children: React.ReactNode;
};

export { DataProvider };
