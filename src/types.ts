import React from 'react';
import { FSA } from 'flux-standard-action';
import { Schema, schemas } from './resource';

export type Method = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options';

export type AbstractInstanceType<T> = T extends { prototype: infer U }
  ? U
  : never;

export type PK = string | number;

export type State<T> = Readonly<{
  entities: Readonly<{ [k: string]: { [id: string]: T } | undefined }>;
  results: Readonly<{ [url: string]: unknown | PK[] | PK | undefined }>;
  meta: Readonly<{
    [url: string]: { date: number; error?: Error; expiresAt: number };
  }>;
}>;

export interface ReceiveAction extends FSA<any, any> {
  type: 'receive';
  meta: {
    schema: Schema;
    url: string;
    date: number;
    expiresAt: number;
  };
}
export interface RPCAction extends FSA<any, any> {
  type: 'rpc';
  meta: {
    schema: Schema;
    url: string;
  };
}
export interface PurgeAction extends FSA<any, any> {
  type: 'purge';
  meta: {
    schema: schemas.Entity;
    url: string;
  };
}
export interface FetchAction extends FSA<any, any> {
  type: 'fetch';
  payload: () => Promise<any>;
  meta: {
    schema?: Schema;
    url: string;
    responseType: 'rpc' | 'receive' | 'purge';
    throttle: boolean;
    errorExpiryLength?: number;
    dataExpiryLength?: number;
    resolve: (value?: any | PromiseLike<any>) => void;
    reject: (reason?: any) => void;
  };
}
// put other actions here in union
export type ActionTypes = FetchAction | ReceiveAction | RPCAction | PurgeAction;

export type Middleware = <R extends React.Reducer<any, any>>({
  dispatch,
}: {
dispatch: React.Dispatch<React.ReducerAction<R>>;
}) => (
  next: React.Dispatch<React.ReducerAction<R>>,
) => (action: React.ReducerAction<R>) => void;
