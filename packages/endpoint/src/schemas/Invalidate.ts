import PolymorphicSchema from './Polymorphic.js';
import type { EntityInterface, INormalizeDelegate } from '../interface.js';
import type { AbstractInstanceType } from '../normal.js';

type ProcessableEntity = EntityInterface & { process: any };

/** Structural type for hoistable polymorphic schemas like Union */
type HoistablePolymorphic = {
  readonly _hoistable: true;
  schema: any;
  getSchemaAttribute: (...args: any) => any;
};

/**
 * Marks entity as Invalid.
 *
 * This triggers suspense for all endpoints requiring it.
 * Optional (like variable sized Array and Values) will simply remove the item.
 * @see https://dataclient.io/rest/api/Invalidate
 */
export default class Invalidate<
  E extends
    | ProcessableEntity
    | Record<string, ProcessableEntity>
    | HoistablePolymorphic,
> extends PolymorphicSchema {
  /**
   * Marks entity as Invalid.
   *
   * This triggers suspense for all endpoints requiring it.
   * Optional (like variable sized Array and Values) will simply remove the item.
   * @see https://dataclient.io/rest/api/Invalidate
   */
  constructor(
    entity: E,
    schemaAttribute?: E extends HoistablePolymorphic ? undefined
    : E extends Record<string, ProcessableEntity> ?
      string | ((input: any, parent: any, key: any) => string)
    : undefined,
  ) {
    if (process.env.NODE_ENV !== 'production' && !entity) {
      throw new Error('Invalidate schema requires "entity" option.');
    }
    super(entity, schemaAttribute);
  }

  get key(): string {
    return this.schemaKey();
  }

  normalize(
    input: any,
    parent: any,
    key: string | undefined,
    args: any[],
    visit: (...args: any) => any,
    delegate: INormalizeDelegate,
  ): string | { id: string; schema: string } {
    const entitySchema = this.inferSchema(input, parent, key);
    if (!entitySchema) return input;

    // Handle string/number input (already processed pk)
    // Note: This branch is typically not reached through public API as getVisit
    // handles primitives before calling schema.normalize()
    let pk: string | number | undefined;
    /* istanbul ignore if */
    if (typeof input === 'string' || typeof input === 'number') {
      pk = input;
    } else {
      // Must call process() to get correct pk
      const processedEntity = entitySchema.process(input, parent, key, args);
      pk = entitySchema.pk(processedEntity ?? input, parent, key, args);

      if (
        process.env.NODE_ENV !== 'production' &&
        (pk === undefined || pk === '' || pk === 'undefined')
      ) {
        const error = new Error(
          `Missing usable primary key when normalizing response.

  This is likely due to a malformed response.
  Try inspecting the network response or fetch() return value.
  Or use debugging tools: https://dataclient.io/docs/getting-started/debugging
  Learn more about schemas: https://dataclient.io/docs/api/schema

  Invalidate(Entity): Invalidate(${entitySchema.key})
  Value (processed): ${input && JSON.stringify(input, null, 2)}
  `,
        );
        (error as any).status = 400;
        throw error;
      }
    }
    pk = `${pk}`; // ensure pk is a string

    // any queued updates are meaningless with delete, so we should just set it
    // and creates will have a different pk
    delegate.invalidate(entitySchema, pk);

    return this.isSingleSchema ? pk : (
        { id: pk, schema: this.getSchemaAttribute(input, parent, key) }
      );
  }

  queryKey(_args: any, _unvisit: unknown, _delegate: unknown): undefined {
    return undefined;
  }

  denormalize(
    id: string | { id: string; schema: string },
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): E extends ProcessableEntity ? AbstractInstanceType<E>
  : AbstractInstanceType<E[keyof E]> {
    // denormalizeValue handles both single entity and polymorphic cases
    return this.denormalizeValue(id, unvisit) as any;
  }

  /* istanbul ignore next */
  _denormalizeNullable():
    | (E extends ProcessableEntity ? AbstractInstanceType<E>
      : AbstractInstanceType<E[keyof E]>)
    | undefined {
    return {} as any;
  }

  /* istanbul ignore next */
  _normalizeNullable(): string | undefined {
    return {} as any;
  }
}
