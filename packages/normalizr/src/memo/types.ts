import WeakDependencyMap from './WeakDependencyMap.js';
import { EntityInterface } from '../interface.js';
import { EntityPath } from '../types.js';

export interface EntityCache {
  [key: string]: {
    [pk: string]: WeakMap<
      EntityInterface,
      WeakDependencyMap<EntityPath, object, any>
    >;
  };
}
export type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;
