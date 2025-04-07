import type {
  EntityInterface,
  INormalizeDelegate,
  SchemaSimple,
} from '../interface.js';
import type { AbstractInstanceType } from '../normal.js';
import { INVALID } from '../special.js';

/**
 * Marks entity as Invalid.
 *
 * This triggers suspense for all endpoints requiring it.
 * Optional (like variable sized Array and Values) will simply remove the item.
 * @see https://dataclient.io/rest/api/Invalidate
 */
export default class Invalidate<
  E extends EntityInterface & {
    process: any;
  },
> implements SchemaSimple
{
  declare protected _entity: E;

  /**
   * Marks entity as Invalid.
   *
   * This triggers suspense for all endpoints requiring it.
   * Optional (like variable sized Array and Values) will simply remove the item.
   * @see https://dataclient.io/rest/api/Invalidate
   */
  constructor(entity: E) {
    if (process.env.NODE_ENV !== 'production' && !entity) {
      throw new Error('Expected option "entity" not found on DeleteSchema.');
    }
    this._entity = entity;
  }

  get key() {
    return this._entity.key;
  }

  /** Normalize lifecycles **/
  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string | number | undefined {
    // TODO: what's store needs to be a differing type from fromJS
    const processedEntity = this._entity.process(input, parent, key, args);
    const id = `${this._entity.pk(processedEntity, parent, key, args)}`;

    if (
      process.env.NODE_ENV !== 'production' &&
      (id === undefined || id === '' || id === 'undefined')
    ) {
      const error = new Error(
        `Missing usable primary key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://dataclient.io/docs/getting-started/debugging
  Learn more about schemas: https://dataclient.io/docs/api/schema

  Invalidate(Entity): Invalidate(${this._entity.key})
  Value (processed): ${input && JSON.stringify(input, null, 2)}
  `,
      );
      (error as any).status = 400;
      throw error;
    }
    delegate.addEntity(this as any, INVALID, id);
    return id;
  }

  /* istanbul ignore next */
  merge(existing: any, incoming: any) {
    return incoming;
  }

  mergeWithStore(
    existingMeta: any,
    incomingMeta: any,
    existing: any,
    incoming: any,
  ) {
    // any queued updates are meaningless with delete, so we should just set it
    return this.merge(existing, incoming);
  }

  mergeMetaWithStore(
    existingMeta: {
      expiresAt: number;
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { expiresAt: number; date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return incomingMeta;
  }

  /** /End Normalize lifecycles **/

  queryKey(args: any, queryKey: unknown, snapshot: unknown): undefined {
    return undefined;
  }

  denormalize(
    id: string,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): AbstractInstanceType<E> {
    return unvisit(this._entity, id) as any;
  }

  /* istanbul ignore next */
  _denormalizeNullable(): AbstractInstanceType<E> | undefined {
    return {} as any;
  }

  /* istanbul ignore next */
  _normalizeNullable(): string | undefined {
    return {} as any;
  }
}
