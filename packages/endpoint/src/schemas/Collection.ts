import PolymorphicSchema from './Polymorphic.js';
import { filterEmpty, getValues } from './utils.js';

/**
 * Entities but for Arrays instead of classes
 * @see https://resthooks.io/rest/api/Collection
 */
export default class CollectionSchema extends PolymorphicSchema {
  declare instanceKey: (parent: any, key: string) => string;
  constructor(
    definition: any,
    instanceKey: (parent: any, key: string) => string,
    schemaAttribute?: string | ((...args: any) => any),
  ) {
    super(definition, schemaAttribute);
    this.instanceKey = instanceKey;
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
  ): any {
    const values = getValues(input);

    return values
      .map((value, index) =>
        this.normalizeValue(
          value,
          parent,
          key,
          visit,
          addEntity,
          visitedEntities,
        ),
      )
      .filter(value => value !== undefined && value !== null);
  }

  denormalize(
    input: any[],
    unvisit: any,
  ): [denormalized: any, found: boolean, deleted: boolean] {
    input.forEach((entityOrId, i) => {
      const value = this.denormalizeValue(entityOrId, unvisit);
      if (!value[2]) input[i] = value[0];
    });
    return [input, true, false];
  }

  infer(
    args: unknown,
    indexes: unknown,
    recurse: unknown,
    entities: unknown,
  ): any {
    return undefined;
  }

  toJSON() {
    return [this.schema];
  }

  get key() {
    return `LIST:${this.schema.key}`;
  }

  pk(value: any, parent: any, key: string) {
    return JSON.stringify(this.instanceKey(parent, key));
  }

  createIfValid(value: any): any | undefined {
    return value ? [...value] : undefined;
  }

  shouldReorder(
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return incomingMeta.fetchedAt < existingMeta.fetchedAt;
  }

  mergeWithStore(
    existingMeta: {
      date: number;
      fetchedAt: number;
    },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming)
      ? this.merge(incoming, existing)
      : this.merge(existing, incoming);
  }

  merge(existing: any, incoming: any) {
    return incoming;
  }
}
