import type React from 'react';

export type ReducerAction<R extends React.Reducer<any, any>> =
  R extends React.Reducer<any, infer A> ? A : never;
