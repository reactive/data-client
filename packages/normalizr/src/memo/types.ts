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
