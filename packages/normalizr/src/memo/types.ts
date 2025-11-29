import WeakDependencyMap, { GetDependency } from './WeakDependencyMap.js';
import type { BaseDelegate } from '../delegate/BaseDelegate.js';
import type { EntityInterface, EntityPath } from '../interface.js';

export interface EntityCache extends Map<
  string,
  Map<
    string,
    WeakMap<EntityInterface, WeakDependencyMap<EntityPath, object, any>>
  >
> {}

export type EndpointsCache = WeakDependencyMap<EntityPath, object, any>;

export type DenormGetEntity = GetDependency<EntityPath>;

export interface IMemoPolicy {
  QueryDelegate: new (v: { entities: any; indexes: any }) => BaseDelegate;
  getEntities(entities: any): DenormGetEntity;
}
