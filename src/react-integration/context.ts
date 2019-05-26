import React from 'react';
import { ActionTypes } from 'types';
import { initialState } from '~/state/reducer';

export const StateContext = React.createContext(initialState);
export const DispatchContext = React.createContext((value: ActionTypes) => {});
