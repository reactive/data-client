import WeakDependencyMap, { GetDependency } from './WeakDependencyMap.js';
import type { BaseDelegate } from '../delegate/BaseDelegate.js';
import type {
  EntityInterface,
  EntityPath,
  IValuePolicy,
} from '../interface.js';

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
  /** Value-representation strategy for denormalization.
   * Optional for backwards compatibility — defaults to the plain (POJO) policy. */
  valuePolicy?: IValuePolicy;
}
