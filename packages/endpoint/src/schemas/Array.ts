import PolymorphicSchema from './Polymorphic.js';
import { filterEmpty, getValues } from './utils.js';

/**
 * Represents arrays
 * @see https://dataclient.io/rest/api/Array
 */
export default class ArraySchema extends PolymorphicSchema {
  normalize(
    input: any,
    parent: any,
    key: any,
    visit: any,
    addEntity: any,
    visitedEntities: any,
    storeEntities: any,
    args?: any[],
  ): any {
    const values = getValues(input);

    return values.map((value, index) =>
      this.normalizeValue(
        value,
        parent,
        key,
        visit,
        addEntity,
        visitedEntities,
        storeEntities,
        args,
      ),
    );
  }

  denormalize(
    input: any,
    args: any[],
    unvisit: (input: any, schema: any) => any,
  ) {
    return input.map ?
        input
          .map((entityOrId: any) => this.denormalizeValue(entityOrId, unvisit))
          .filter(filterEmpty)
      : input;
  }

  queryKey(
    args: unknown,
    queryKey: unknown,
    lookupEntities: unknown,
    lookupIndex: unknown,
  ): any {
    return undefined;
  }

  toJSON() {
    return [this.schema];
  }
}
