import {
  Resource,
  RequestShape,
  DeleteShape,
  ReadShape,
  MutateShape,
  Schema,
  SchemaArray,
  SchemaBase,
  SchemaOf,
} from './resource';
import NetworkManager from './state/NetworkManager';
import { RestProvider, hooks, NetworkErrorBoundary } from './react-integration';
import { makeSchemaSelector } from './state/selectors';
import { Request as RequestType } from 'superagent';
import { AbstractInstanceType } from './types';

export {
  Resource,
  RestProvider,
  hooks,
  makeSchemaSelector,
  NetworkManager,
  NetworkErrorBoundary,
  RequestShape,
  DeleteShape,
  ReadShape,
  MutateShape,
  Schema,
  SchemaArray,
  SchemaBase,
  SchemaOf,
  RequestType,
  AbstractInstanceType,
};
