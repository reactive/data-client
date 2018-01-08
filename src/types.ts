import React from 'react';
import { FSA } from 'flux-standard-action';
import { Schema } from 'normalizr';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export type AbstractInstanceType<T> = T extends { prototype: infer U }
  ? U
  : never;

export type PK = string | number;

export type State<T> = Readonly<{
  entities: Readonly<{ [k: string]: { [id: string]: T } | undefined }>;
  results: Readonly<{ [url: string]: unknown | PK[] | PK | undefined }>;
  meta: Readonly<{ [url: string]: { date: number; error?: Error; expiresAt: number } }>;
}>;

export interface ReceiveAction extends FSA<any, any> {
  type: 'receive';
  meta: {
    schema: Schema;
    url: string;
    mutate: boolean;
    date: number;
    expiresAt: number;
  };
}
export interface FetchAction extends FSA<any, any> {
  type: 'fetch';
  payload: () => Promise<any>;
  meta: {
    schema: Schema;
    url: string;
    mutate: boolean;
    throttle: boolean;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
  };
}
// put other actions here in union
export type ActionTypes = ReceiveAction | FetchAction;

export type Middleware = <R extends React.Reducer<any, any>>({
  dispatch,
}: {
dispatch: React.Dispatch<React.ReducerAction<R>>;
}) => (
  next: React.Dispatch<React.ReducerAction<R>>,
) => (action: React.ReducerAction<R>) => void;
