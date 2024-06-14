import * as _data_client_core from '@data-client/core';
import { Manager, State, Controller } from '@data-client/core';
import * as react_jsx_runtime from 'react/jsx-runtime';

declare function createPersistedStore(managers?: Manager[]): readonly [({ children }: {
    children: React.ReactNode;
}) => react_jsx_runtime.JSX.Element, () => State<unknown>, Controller<_data_client_core.DataClientDispatch>, undefined<State<unknown>, _data_client_core.ActionTypes, unknown> & {
    dispatch: unknown;
}]

declare const awaitInitialData: (id?: string) => Promise<any>;
declare const getInitialData: (id?: string) => any;

declare function createServerDataComponent(useReadyCacheState: () => State<unknown>, id?: string): ({ nonce }: {
    nonce?: string | undefined;
}) => react_jsx_runtime.JSX.Element;

declare const ServerData: ({ data, nonce, id, }: {
    data: State<unknown>;
    id?: string;
    nonce?: string | undefined;
}) => react_jsx_runtime.JSX.Element | null;

export { ServerData, awaitInitialData, createPersistedStore, createServerDataComponent, getInitialData };
