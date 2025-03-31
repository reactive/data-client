import {
  EntityInterface,
  EntityTable,
  NormalizedIndex,
  INormalizeDelegate,
} from '../interface.js';
import { addEntities } from './addEntities.js';
import { getCheckLoop } from './getCheckLoop.js';
import { BaseDelegate } from '../memo/Delegate.js';

export class NormalizeDelegate
  extends BaseDelegate
  implements INormalizeDelegate
{
  declare checkLoop: (entityKey: string, pk: string, input: object) => boolean;
  declare addEntity: (
    schema: EntityInterface,
    processedEntity: any,
    id: string,
  ) => void;

  constructor(
    entities: EntityTable,
    indexes: NormalizedIndex,
    newState: {
      entities: Record<string, any>;
      indexes: Record<string, any>;
      entityMeta: {
        [entityKey: string]: {
          [pk: string]: {
            date: number;
            expiresAt: number;
            fetchedAt: number;
          };
        };
      };
    },
    actionMeta: { fetchedAt: number; date: number; expiresAt: number },
  ) {
    super(entities, indexes);
    this.checkLoop = getCheckLoop();
    this.addEntity = addEntities(newState, actionMeta);
  }
}
