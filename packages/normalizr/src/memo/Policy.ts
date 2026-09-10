import type { DenormGetEntity } from './types.js';
import { POJODelegate } from '../delegate/Delegate.js';
import { PlainValuePolicy } from '../denormalize/valuePolicy.js';
import type { EntityPath, EntityTable } from '../interface.js';

/** Handles POJO state for MemoCache methods */
export const MemoPolicy = {
  QueryDelegate: POJODelegate,
  getEntities(entities: EntityTable): DenormGetEntity {
    return ({ key, pk }: EntityPath): symbol | object | undefined =>
      entities[key]?.[pk] as any;
  },
  valuePolicy: PlainValuePolicy,
};
