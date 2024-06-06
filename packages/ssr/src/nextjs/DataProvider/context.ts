'use client';
import { type State, __INTERNAL__ } from '@data-client/react';
import { createContext } from 'react';

export const readyContext = createContext(
  (): State<unknown> => __INTERNAL__.initialState,
);
