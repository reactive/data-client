import React$1, { JSX, ComponentProps } from 'react';
import { Manager, State, Controller } from '@data-client/core';

type DevToolsPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

interface Props {
    children: React$1.ReactNode;
    managers?: Manager[];
    initialState?: State<unknown>;
    Controller?: typeof Controller;
    devButton?: DevToolsPosition | null | undefined;
}
/**
 * Manages state, providing all context needed to use the hooks.
 * @see https://dataclient.io/docs/api/CacheProvider
 */
declare function CacheProvider({ children, managers, initialState, Controller, devButton, }: Props): JSX.Element;

declare function DataProvider({ children, ...props }: ProviderProps): React.ReactElement;
type ProviderProps = Omit<Partial<ComponentProps<typeof CacheProvider>>, 'initialState'> & {
    children: React.ReactNode;
};

export { DataProvider };
