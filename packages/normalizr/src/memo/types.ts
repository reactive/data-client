import WeakDependencyMap from './WeakDependencyMap.js';
import { EntityInterface } from '../interface.js';
import { EntityPath } from '../types.js';

export interface EntityCache
  extends Map<
    string,
    Map<
      string,
      WeakMap<EntityInterface, WeakDependencyMap<EntityPath, object, any>>
    >
  > {}

export type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;

export type IndexPath = [key: string, field: string, value: string];
export type EntitySchemaPath = [key: string] | [key: string, pk: string];
export type QueryPath = IndexPath | EntitySchemaPath;
