/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { schema, AbstractInstanceType, DELETED } from '@rest-hooks/normalizr';

export default class Delete<E extends schema.EntityInterface & { fromJS: any }>
  implements schema.SchemaClass
{
  private declare _entity: E;

  constructor(entity: E) {
    if (process.env.NODE_ENV !== 'production' && !entity) {
      throw new Error('Expected option "entity" not found on DeleteSchema.');
    }
    this._entity = entity;
  }

  get key() {
    return this._entity.key;
  }

  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    visit: (...args: any) => any,
    addEntity: (...args: any) => any,
    visitedEntities: Record<string, any>,
  ): string | undefined {
    // pass over already processed entities
    if (typeof input === 'string') return input;
    // TODO: what's store needs to be a differing type from fromJS
    const processedEntity = this._entity.fromJS(input, parent, key);
    const id = processedEntity.pk(parent, key);
    if (
      process.env.NODE_ENV !== 'production' &&
      (id === undefined || id === '')
    ) {
      const error = new Error(
        `Missing usable primary key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://resthooks.io/docs/guides/debugging
  Learn more about schemas: https://resthooks.io/docs/api/schema

  Delete(Entity): Delete(${(this._entity as any).name ?? this._entity})
  Value: ${input && JSON.stringify(input, null, 2)}
  `,
      );
      (error as any).status = 400;
      throw error;
    }
    addEntity(this, DELETED, id);
    return id;
  }

  infer(args: any, indexes: any, recurse: any): any {
    return undefined;
  }

  denormalize(
    id: string,
    unvisit: schema.UnvisitFunction,
    globalKey: object[],
  ): [AbstractInstanceType<E>, boolean, boolean] {
    return unvisit(id, this._entity, globalKey) as any;
  }

  /* istanbul ignore next */
  _denormalizeNullable(): [
    AbstractInstanceType<E> | undefined,
    boolean,
    false,
  ] {
    return [] as any;
  }

  /* istanbul ignore next */
  _normalizeNullable(): string | undefined {
    return [] as any;
  }

  /* istanbul ignore next */
  merge(existing: any, incoming: any) {
    return incoming;
  }
}
