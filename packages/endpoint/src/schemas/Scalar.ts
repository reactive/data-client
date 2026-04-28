import type {
  IDenormalizeDelegate,
  INormalizeDelegate,
  IQueryDelegate,
  Mergeable,
  Visit,
} from '../interface.js';

interface ScalarOptions {
  /**
   * Selects the lens value from Endpoint args.
   *
   * The returned value is part of the stored cell key, so it must be stable
   * for a given lens selection.
   */
  lens: (args: readonly any[]) => string | undefined;
  /**
   * Unique namespace for this Scalar's internal entity table.
   */
  key: string;
  /**
   * Entity class this Scalar stores cells for.
   *
   * Optional when used as a field on `Entity.schema`, where the parent Entity
   * is inferred. Required for standalone usage such as `schema.Values`.
   */
  entity?: {
    key: string;
    pk?: (...args: any[]) => string | number | undefined;
  };
}

/**
 * Represents lens-dependent scalar fields on entities.
 *
 * Scalar stores values that belong to an Entity but vary by Endpoint args,
 * such as portfolio-, currency-, or locale-specific columns. Use it as an
 * `Entity.schema` field, or bind `entity` when using it standalone in
 * `schema.Values`.
 *
 * @see https://dataclient.io/rest/api/Scalar
 */
export default class Scalar implements Mergeable {
  readonly key: string;
  readonly lensSelector: (args: readonly any[]) => string | undefined;
  readonly entity: ScalarOptions['entity'];
  readonly entityKey: string | undefined;
  /**
   * Allow normalize to receive primitive field values.
   *
   * Scalar stores per-cell values like `0.5`, so the visit walker must not
   * apply its primitive short-circuit before dispatching to `normalize()`.
   */
  readonly acceptsPrimitives = true;

  /**
   * Represents lens-dependent scalar fields on entities.
   *
   * @see https://dataclient.io/rest/api/Scalar
   */
  constructor(options: ScalarOptions) {
    this.key = `Scalar(${options.key})`;
    this.lensSelector = options.lens;
    this.entity = options.entity;
    this.entityKey = options.entity?.key;
  }

  /**
   * The bound Entity's pk for a standalone scalar cell.
   *
   * Prefers the surrounding map key (authoritative for `Values(Scalar)`,
   * where `parent[key] === input`), then falls back to the bound
   * `Entity.pk(...)`. Other shapes — `[Scalar]` top-level (where `key` is
   * `undefined`) or nested under a plain object schema like
   * `{ stock: [Scalar] }` (where `Array.normalize` forwards the parent
   * object's field name as `key`, but `parent[key]` is the enclosing array,
   * not the item) — must derive pk from the item itself.
   *
   * @see https://dataclient.io/rest/api/Scalar#entityPk
   * @param [input] the scalar cell input
   * @param [parent] When normalizing, the object which included the cell
   * @param [key] When normalizing, the surrounding map key (if any)
   * @param [args] ...args sent to Endpoint
   */
  entityPk(
    input: any,
    parent: any,
    key: string | undefined,
    args: readonly any[],
  ): string | number | undefined {
    // Only trust `key` when the enclosing container literally maps it to this
    // cell — i.e. `Values(Scalar)`, where the map key is the entity pk by
    // construction. `Array.normalize` forwards the *outer* object's field name
    // as `key` for every element (see Array.ts), so `key !== undefined` alone
    // would collapse every item onto the same compound pk.
    if (key !== undefined && parent != null && parent[key] === input) {
      return key;
    }
    return this.entity?.pk?.(input, parent, key, args);
  }

  createIfValid(props: any) {
    return { ...props };
  }

  merge(existing: any, incoming: any) {
    return { ...existing, ...incoming };
  }

  /**
   * Determines whether an incoming write is older than the stored cell.
   *
   * Defaults to comparing `fetchedAt`, matching Entity behavior so older
   * responses do not overwrite newer values.
   */
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
    if (typeof parentEntity === 'function' && parentEntity.pk) {
      const entityKey: string = parentEntity.key;
      // TODO: this re-derives the enclosing entity's pk without the enclosing
      // `parent`/`key` context that `EntityMixin.normalize` used to compute
      // the authoritative id (see EntityMixin.ts around `this.pk(processedEntity, parent, key, args)`).
      // If a custom `pk()` reads its 2nd/3rd args, we will key the Scalar cell
      // differently than the entity is stored under and denormalize will miss.
      // Fix by threading the enclosing parent/key through the visit walker
      // (e.g. via a parentContext param on `visit` / INormalizeDelegate) and
      // forwarding them here instead of `undefined, undefined`.
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

    // Standalone path: input is scalar cell data, and pk is derived from either
    // the item itself (`[Scalar]`) or the surrounding key (`Values(Scalar)`).
    // No parent entity to infer from — require explicit `entity` binding.
    if (this.entityKey === undefined) {
      throw new Error(
        'Scalar used standalone (e.g. inside `schema.Values`) requires an `entity` option to bind it to an Entity class.',
      );
    }
    const id = this.entityPk(input, parent, key, args);
    if (id === undefined) {
      throw new Error(
        `${this.key}: cannot derive entity pk for cell. Provide items with an ` +
          '`id` field, a pk-keyed map key, or override Scalar.entityPk().',
      );
    }
    // cpk = compound pk: `"entityKey|entityPk|lensValue"`; used throughout this file.
    const cpk = `${this.entityKey}|${id}|${lensValue}`;
    delegate.mergeEntity(this, cpk, { ...input });
    return cpk;
  }

  denormalize(input: any, delegate: IDenormalizeDelegate): any {
    // Legit inputs are wrapper array, cpk string, cell object, or symbol.
    // Any other primitive — falsy (`0`, `''`, `false`, `null`, `undefined`)
    // or truthy (`0.5`, `true`, `42`, `bigint`, `symbol`, etc.) — cannot be
    // resolved via the entity table and must short-circuit here. Without
    // this, non-string truthy primitives would infinite-recurse through the
    // Values branch below: `unvisit` re-dispatches back to us because
    // `isEntity(this)` is false and its string-only fast path misses. This
    // can happen during schema migration when a Scalar is added to an entity
    // with cached raw numeric/boolean field values still in the store.
    if (!input || (typeof input !== 'object' && typeof input !== 'string')) {
      return input;
    }

    // Entity-field wrapper `[entityPk, fieldName, entityKey]`: cpk is derived
    // from current `args`, so record `lensSelector` on the enclosing Entity's
    // cache frame. `lensSelector` must be ctor-bound (stable ref); see WeakDependencyMap.
    if (Array.isArray(input)) {
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

    // String-cpk fallback. Walker-driven Values(Scalar) never reaches this —
    // `unvisit.ts` intercepts string+createIfValid before `schema.denormalize`.
    // No `argsKey`: cpk is fixed at normalize-time; per-entity WDM keys on cpk.
    return delegate.unvisit(this, input);
  }

  /**
   * Returns the cpks of cells matching the current lens, or undefined.
   *
   * Only consulted when `Scalar` is an endpoint's top-level schema; field
   * usage resolves through the parent entity. Relies on `lens` not
   * containing the cpk delimiter `|`.
   */
  queryKey(
    args: readonly any[],
    unvisit: any,
    delegate: IQueryDelegate,
  ): string[] | undefined {
    const lens = this.lensSelector(args);
    if (lens === undefined) return undefined;

    const cells = delegate.getEntities(this.key);
    if (!cells) return undefined;

    const cpks: string[] = [];
    for (const [cpk, entity] of cells.entries()) {
      if (!entity || typeof entity === 'symbol') continue;
      const lastPipe = cpk.lastIndexOf('|');
      if (lastPipe !== -1 && cpk.slice(lastPipe + 1) === lens) {
        cpks.push(cpk);
      }
    }
    return cpks.length ? cpks : undefined;
  }
}
