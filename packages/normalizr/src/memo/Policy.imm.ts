import { ImmDelegate } from '../delegate/Delegate.imm.js';
import type { EntityPath } from '../interface.js';
import type { DenormGetEntity } from './types.js';

/** Handles ImmutableJS state for MemoCache methods */
export const MemoPolicy = {
  QueryDelegate: ImmDelegate,
  getEntities(entities: {
    getIn(path: [string, string]): unknown;
  }): DenormGetEntity {
    return ({ key, pk }: EntityPath): symbol | object | undefined =>
      entities.getIn([key, pk]) as any;
  },
};
