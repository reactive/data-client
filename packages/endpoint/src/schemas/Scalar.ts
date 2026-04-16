import type {
  INormalizeDelegate,
  IQueryDelegate,
  Mergeable,
  Visit,
} from '../interface.js';

interface ScalarOptions {
  lens: (args: readonly any[]) => string | undefined;
  key: string;
  /**
   * The Entity class this Scalar attaches to. Optional when only used as a
   * field on `Entity.schema` (entity context is inferred at normalize time
   * and recorded on the wrapper). Required when used standalone — e.g. inside
   * `schema.Values` for column-only fetches — where there is no parent entity
   * to infer from.
   */
  entity?: { key: string };
}

/**
 * Schema for lens-dependent scalar fields on entities.
 *
 * Scalar fields vary by a "lens" selection (e.g. which portfolio).
 * Data is stored in a Scalar entity table and joined at
 * denormalize time based on endpoint args.
 *
 * A single Scalar instance can be shared across multiple entity types when
 * used as a field on `Entity.schema` — the entity key is parsed from the
 * normalize key path and stored on the wrapper so denormalize can recover
 * the correct cell. To use a Scalar standalone (e.g. inside `schema.Values`
 * for a column-only endpoint), bind it to an Entity class with the `entity`
 * option since there is no parent entity to infer from.
 *
 * @see https://dataclient.io/rest/api/Scalar
 */
export default class Scalar implements Mergeable {
  readonly key: string;
  readonly lensSelector: (args: readonly any[]) => string | undefined;
  readonly entityKey: string | undefined;

  constructor(options: ScalarOptions) {
    this.key = `Scalar(${options.key})`;
    this.lensSelector = options.lens;
    this.entityKey = options.entity?.key;
  }

  createIfValid(props: any) {
    return { ...props };
  }

  merge(existing: any, incoming: any) {
    return { ...existing, ...incoming };
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
    existingMeta: { date: number; fetchedAt: number },
    incomingMeta: { date: number; fetchedAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming) ?
        this.merge(incoming, existing)
      : this.merge(existing, incoming);
  }

  mergeMetaWithStore(
    existingMeta: { fetchedAt: number; date: number; expiresAt: number },
    incomingMeta: { fetchedAt: number; date: number; expiresAt: number },
    existing: any,
    incoming: any,
  ) {
    return this.shouldReorder(existingMeta, incomingMeta, existing, incoming) ?
        existingMeta
      : incomingMeta;
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: Visit,
    delegate: INormalizeDelegate,
  ): any {
    // Entity path: EntityMixin encodes the key as '<entityKey>|<entityPk>|<fieldName>'
    //              and passes the whole entity object as `input` (to sidestep the
    //              primitive short-circuit in getVisit).
    // Values path: Values encodes `key` as the dictionary key (= entity pk) and
    //              passes the raw cell data as `input`.
    const isEntityPath = parent?.schema !== undefined;
    const lensValue = this.lensSelector(args);

    if (isEntityPath) {
      // `parent` here is the Entity *class* itself (e.g. the `Company`
      // class), not the parent data row. EntityMixin's normalize loop
      // deliberately passes `this` (the Entity class) as `parent` for
      // Scalar fields — this is a Scalar-specific convention; the standard
      // `Visit` contract is that `parent` is the containing data (see
      // `Visit` JSDoc in `interface.ts`).
      //
      // We read the static `.key` (the entity key, e.g. `'Company'`) — not a
      // runtime pk — directly from the class. This is more robust than
      // re-parsing it out of the encoded key string, which would be
      // ambiguous for composite primary keys that may contain `|`.
      const entityKey: string = parent.key;
      const keyStr = `${key}`;
      const lastPipe = keyStr.lastIndexOf('|');
      const fieldName = keyStr.slice(lastPipe + 1);
      // Slice off the leading `${entityKey}|` prefix; this is robust to
      // composite pks that legitimately contain `|` (e.g. "type|123").
      const entityPk = keyStr.slice(entityKey.length + 1, lastPipe);

      const cpk = `${entityKey}|${entityPk}|${lensValue}`;
      // Merge only this field's value — EntityMixin calls us once per
      // scalar field, and `merge` accumulates them into the cell.
      if (fieldName in input) {
        delegate.mergeEntity(this, cpk, { [fieldName]: input[fieldName] });
      }

      // Record entityKey on the wrapper so denormalize can resolve the
      // correct cell even when one Scalar instance is shared across
      // multiple entity types.
      return { id: entityPk, field: fieldName, entityKey };
    }

    // Values path: input IS the scalar cell data, key IS the entity pk.
    // No parent entity to infer from — require explicit `entity` binding.
    if (this.entityKey === undefined) {
      throw new Error(
        'Scalar used standalone (e.g. inside `schema.Values`) requires an `entity` option to bind it to an Entity class.',
      );
    }
    const entityPk = `${key}`;
    const cpk = `${this.entityKey}|${entityPk}|${lensValue}`;
    delegate.mergeEntity(this, cpk, { ...input });
    return cpk;
  }

  denormalize(
    input: any,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): any {
    if (!input || typeof input === 'symbol') return input;

    // input from entity field: { id, field, entityKey } (Union-like wrapper)
    if (typeof input === 'object' && 'field' in input) {
      const lensValue = this.lensSelector(args);
      if (lensValue === undefined) return undefined;
      // Prefer entityKey on the wrapper (recorded during entity-path
      // normalize) so a Scalar shared across entity types resolves the
      // correct cell. Fall back to the bound entity for back-compat.
      const entityKey = input.entityKey ?? this.entityKey;
      const cpk = `${entityKey}|${input.id}|${lensValue}`;
      const cellData = unvisit(this, cpk);
      if (cellData && typeof cellData !== 'symbol') {
        return cellData[input.field];
      }
      return undefined;
    }

    if (typeof input === 'object') return input;

    // Values path: input is the compound pk string
    return unvisit(this, input);
  }

  queryKey(args: readonly any[], unvisit: any, delegate: IQueryDelegate): any {
    return undefined;
  }
}
