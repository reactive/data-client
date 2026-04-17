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
 * used as a field on `Entity.schema` — the enclosing Entity is supplied
 * by `EntityMixin.normalize` (as `parentEntity`) and recorded on the
 * wrapper so denormalize can recover the correct cell. To use a Scalar
 * standalone (e.g. inside `schema.Values` for a column-only endpoint), bind
 * it to an Entity class with the `entity` option since there is no parent
 * entity to infer from.
 *
 * @see https://dataclient.io/rest/api/Scalar
 */
export default class Scalar implements Mergeable {
  readonly key: string;
  readonly lensSelector: (args: readonly any[]) => string | undefined;
  readonly entityKey: string | undefined;
  /** Marks this schema as accepting primitive values directly. `EntityMixin`'s
   * normalize loop dispatches to `normalize()` instead of routing through
   * `visit` (whose primitive short-circuit would otherwise bypass us). */
  readonly acceptsPrimitives = true;

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
    parentEntity: any,
  ): any {
    const lensValue = this.lensSelector(args);

    // Entity-field path: EntityMixin.normalize supplies the enclosing
    // Entity class as `parentEntity`. `input` is the per-cell scalar value
    // (e.g. 0.5), `parent` is the entity data row, `key` is the field name.
    if (parentEntity && parentEntity.pk) {
      const entityKey: string = parentEntity.key;
      const entityPk = `${parentEntity.pk(parent, undefined, undefined, args)}`;
      const fieldName = `${key}`;

      const cpk = `${entityKey}|${entityPk}|${lensValue}`;
      // Merge only this field's value — EntityMixin's loop calls us once
      // per scalar field, and `merge` accumulates them into the cell.
      delegate.mergeEntity(this, cpk, { [fieldName]: input });

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
