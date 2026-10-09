import { IDenormalizeDelegate, Visit } from '../interface.js';

export default class PolymorphicSchema {
  declare private _schemaAttribute: any;
  protected schema: any;

  constructor(
    definition: any,
    schemaAttribute?: string | ((...args: any) => any),
  ) {
    if (schemaAttribute) {
      this._schemaAttribute =
        typeof schemaAttribute === 'string' ?
          (input: any) => input[schemaAttribute]
        : schemaAttribute;
    }
    this.define(definition);
  }

  get isSingleSchema() {
    return !this._schemaAttribute;
  }

  define(definition: any) {
    // Only Union opts into hoisting (_hoistable = true)
    // This prevents Array(Array(...)), Values(Array(...)), Array(Invalidate(...)) issues
    if (definition._hoistable && !this._schemaAttribute) {
      this.schema = definition.schema;
      this._schemaAttribute = definition._schemaAttribute;
    } else {
      this.schema = definition;
    }
  }

  getSchemaAttribute(input: any, parent: any, key: any) {
    return !this.isSingleSchema && this._schemaAttribute(input, parent, key);
  }

  inferSchema(input: any, parent: any, key: any) {
    if (this.isSingleSchema) {
      return this.schema;
    }

    const attr = this.getSchemaAttribute(input, parent, key);
    return this.schema[attr];
  }

  schemaKey(): string {
    if (this.isSingleSchema) {
      return this.schema.key;
    }
    return Object.values(this.schema).join(';');
  }

  normalizeValue(
    value: any,
    parent: any,
    key: any,
    delegate: { visit: Visit },
  ) {
    if (!value) return value;
    const isSingle = this.isSingleSchema;
    const schema =
      isSingle ?
        this.schema
      : this.schema[this._schemaAttribute(value, parent, key)];
    if (!schema) {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        const attr = this._schemaAttribute(value, parent, key);
        console.warn(
          `Schema attribute ${JSON.stringify(
            attr,
            undefined,
            2,
          )} is not expected.
Expected one of: ${Object.keys(this.schema)
            .map(k => `"${k}"`)
            .join(', ')}

Value: ${JSON.stringify(value, undefined, 2)}`,
        );
      }
      return value;
    }
    const normalizedValue = delegate.visit(schema, value, parent, key);
    return (
        isSingle || normalizedValue === undefined || normalizedValue === null
      ) ?
        normalizedValue
      : {
          id: normalizedValue,
          schema: this._schemaAttribute(value, parent, key),
        };
  }

  // value is guaranteed by caller to not be null
  denormalizeValue(value: any, delegate: IDenormalizeDelegate) {
    const isSingle = this.isSingleSchema;
    // getField respects the value representation (e.g. ImmutableJS refs under
    // the /imm policy); direct reads are the fallback for delegates from
    // older @data-client/normalizr versions.
    const getField = delegate.getField;
    const schemaKey =
      !isSingle &&
      value &&
      (getField ? getField(value, 'schema') : value.schema);
    if (!isSingle && !schemaKey) {
      // denormalize should also handle 'passthrough' values (not normalized) and still
      // construct the correct Entity instance
      if (typeof value === 'object' && value !== null) {
        const schema = this.inferSchema(value, undefined, undefined);
        if (schema) return delegate.unvisit(schema, value);
      }
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production' && value) {
        console.warn(
          `TypeError: Unable to determine schema for ${this.constructor.name}
Value: ${JSON.stringify(value, undefined, 2)}.`,
        );
      }
      return value;
    }
    const id =
      isSingle ? undefined
      : getField ? getField(value, 'id')
      : value.id;
    const schema = isSingle ? this.schema : this.schema[schemaKey];
    return delegate.unvisit(schema, id || value);
  }
}
