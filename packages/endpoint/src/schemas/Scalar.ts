import type {
  IDenormalizeDelegate,
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
 * used as a field on `Entity.schema` — the enclosing Entity is supplied by
 * the visit walker (as `parentEntity`) and recorded on the wrapper so
 * denormalize can recover the correct cell. To use a Scalar standalone
 * (e.g. inside `schema.Values` for a column-only endpoint), bind it to an
 * Entity class with the `entity` option since there is no parent entity to
 * infer from.
 *
 * @see https://dataclient.io/rest/api/Scalar
 */
export default class Scalar implements Mergeable {
  readonly key: string;
  readonly lensSelector: (args: readonly any[]) => string | undefined;
  readonly entityKey: string | undefined;
  /** Opt-in marker: tells the visit walker to dispatch to `normalize()` for
   * primitive values (the per-cell scalar value, e.g. `0.5`) instead of
   * applying its primitive short-circuit. */
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

  /** Override point: decide whether the incoming write should be reordered
   * behind the existing one. Default compares `fetchedAt` so older writes
   * never clobber newer ones (matches Entity behavior). */
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

    // Without a lens we cannot derive a retrievable cell key — writing to
    // `${…}|undefined` would silently corrupt the Scalar table (literal
    // "undefined" collides across rows) and denormalize would never find
    // the data. A missing lens during normalize is a configuration bug;
    // throw rather than mask it.
    if (lensValue === undefined) {
      throw new Error(
        `${this.key}: lens returned undefined during normalize. Ensure endpoint args contain the lens value.`,
      );
    }

    // Entity-field path: the visit walker supplies the enclosing Entity
    // class as `parentEntity`. `input` is the per-cell scalar value
    // (e.g. 0.5), `parent` is the entity data row, `key` is the field name
    // (always a string from Object.keys, no coercion needed).
    if (parentEntity && parentEntity.pk) {
      const entityKey: string = parentEntity.key;
      const id = `${parentEntity.pk(parent, undefined, undefined, args)}`;
      // Merge only this field's value — EntityMixin's loop calls us once
      // per scalar field, and `merge` accumulates them into the cell.
      delegate.mergeEntity(this, `${entityKey}|${id}|${lensValue}`, {
        [key]: input,
      });
      // Wrapper is a tuple: `[entityPk, fieldName, entityKey]`. Using an
      // array (not an object) lets denormalize distinguish it from cell
      // data via `Array.isArray` without a brand property — and produces
      // smaller serialized state for SSR. `entityKey` is recorded so a
      // single Scalar shared across entity types resolves the correct cell.
      return [id, key, entityKey];
    }

    // Values path: input IS the scalar cell data, key IS the entity pk.
    // No parent entity to infer from — require explicit `entity` binding.
    if (this.entityKey === undefined) {
      throw new Error(
        'Scalar used standalone (e.g. inside `schema.Values`) requires an `entity` option to bind it to an Entity class.',
      );
    }
    const cpk = `${this.entityKey}|${key}|${lensValue}`;
    delegate.mergeEntity(this, cpk, { ...input });
    return cpk;
  }

  denormalize(input: any, delegate: IDenormalizeDelegate): any {
    if (!input || typeof input === 'symbol') return input;

    // Entity-field wrapper: `[entityPk, fieldName, entityKey]` (see normalize).
    if (Array.isArray(input)) {
      // `argsKey` registers `lensSelector` as a string-keyed dependency on
      // the surrounding entity-cache frame — so the Scalar wrapper's cached
      // denormalize result varies per-lens. The function reference must be
      // stable (set once in the constructor); see WeakDependencyMap.
      const lensValue = delegate.argsKey(this.lensSelector);
      if (lensValue === undefined) return undefined;
      const cellData = delegate.unvisit(
        this,
        `${input[2]}|${input[0]}|${lensValue}`,
      );
      return cellData && typeof cellData !== 'symbol' ?
          cellData[input[1]]
        : undefined;
    }

    // Cell data passes through unchanged (recursive call from `unvisit`
    // when looking up the cell via its compound pk).
    if (typeof input === 'object') return input;

    // Values path: input is the compound pk string.
    return delegate.unvisit(this, input);
  }

  queryKey(args: readonly any[], unvisit: any, delegate: IQueryDelegate): any {
    return undefined;
  }
}
