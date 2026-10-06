import react, { JSX, ComponentProps } from 'react';
import { Manager, State, GCInterface, Controller } from '@data-client/core';

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
}
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/DataProvider
 */
declare function DataProvider$1({ children, managers, gcPolicy, initialState, Controller, devButton, }: ProviderProps$1): JSX.Element;

declare function DataProvider({ children, ...props }: ProviderProps): React.ReactElement;
type ProviderProps = Omit<Partial<ComponentProps<typeof DataProvider$1>>, 'initialState'> & {
    children: React.ReactNode;
};

export { DataProvider };
