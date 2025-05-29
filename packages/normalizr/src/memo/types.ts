import WeakDependencyMap from './WeakDependencyMap.js';
import type { EntityInterface, EntityPath } from '../interface.js';

export interface EntityCache
  extends Map<
    string,
    Map<
      string,
      WeakMap<EntityInterface, WeakDependencyMap<EntityPath, object, any>>
    >
  > {}

export type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;
