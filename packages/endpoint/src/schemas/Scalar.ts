import type {
  INormalizeDelegate,
  IQueryDelegate,
  Mergeable,
  Visit,
} from '../interface.js';

interface ScalarOptions {
  lens: (args: readonly any[]) => string | undefined;
  key: string;
}

/**
 * Internal entity-like class that stores grouped scalar cell data
 * in the normalized entity table.
 */
class ScalarCell implements Mergeable {
  readonly key: string;

  constructor(name: string) {
    this.key = `ScalarCell(${name})`;
  }

  pk(value: any, parent?: any, key?: string, args?: any[]) {
    return undefined;
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
  ) {
    return input;
  }

  denormalize(
    input: any,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ) {
    return input;
  }

  queryKey(args: readonly any[], unvisit: any, delegate: IQueryDelegate) {
    return undefined;
  }
}

/**
 * Schema for lens-dependent scalar fields on entities.
 *
 * Scalar fields vary by a "lens" selection (e.g. which portfolio).
 * Data is stored in a ScalarCell entity table and joined at
 * denormalize time based on endpoint args.
 *
 * @see https://dataclient.io/rest/api/Scalar
 */
export default class Scalar {
  readonly key: string;
  readonly lensSelector: (args: readonly any[]) => string | undefined;

  declare _cellSchema: ScalarCell;
  declare _entityKey: string | undefined;
  declare _lastProcessed: any;
  declare _lastCpk: string;

  constructor(options: ScalarOptions) {
    this.key = `Scalar(${options.key})`;
    this.lensSelector = options.lens;
    this._cellSchema = new ScalarCell(options.key);
    this._entityKey = undefined;
    this._lastProcessed = undefined;
    this._lastCpk = '';
  }

  normalize(
    input: any,
    parent: any,
    key: any,
    args: any[],
    visit: Visit,
    delegate: INormalizeDelegate,
  ): any {
    // key from EntityMixin: 'Company|1|pct_equity' (entityKey|entityPk|fieldName)
    // key from Values:       '1' (just the dictionary key = entity pk)
    const isEntityPath = parent?.schema !== undefined;

    if (isEntityPath) {
      const keyStr = `${key}`;
      const lastPipe = keyStr.lastIndexOf('|');
      const fieldName = keyStr.slice(lastPipe + 1);
      const entityPart = keyStr.slice(0, lastPipe);
      const secondLastPipe = entityPart.lastIndexOf('|');
      const entityPk = entityPart.slice(secondLastPipe + 1);
      const entityKey = entityPart.slice(0, secondLastPipe);

      // Only mergeEntity once per entity (short-circuit on same object)
      if (this._lastProcessed !== input) {
        this._lastProcessed = input;
        this._entityKey = entityKey;
        const cellData: Record<string, any> = {};
        for (const [f, s] of Object.entries(parent.schema)) {
          if (s === this && f in input) cellData[f] = input[f];
        }
        const lensValue = this.lensSelector(args);
        const cpk = `${entityKey}|${entityPk}|${lensValue}`;
        delegate.mergeEntity(this._cellSchema, cpk, cellData);
      }

      return { id: entityPk, field: fieldName };
    } else {
      // Values path: input IS the scalar data, key IS the entity pk
      const entityPk = `${key}`;
      const lensValue = this.lensSelector(args);
      const cpk = `${this._entityKey}|${entityPk}|${lensValue}`;
      delegate.mergeEntity(this._cellSchema, cpk, { ...input });
      return cpk;
    }
  }

  denormalize(
    input: any,
    args: readonly any[],
    unvisit: (schema: any, input: any) => any,
  ): any {
    if (!input || typeof input === 'symbol') return input;

    // input from entity field: { id: '1', field: 'pct_equity' } (Union-like wrapper)
    if (typeof input === 'object') {
      const lensValue = this.lensSelector(args);
      if (lensValue === undefined) return undefined;
      const cpk = `${this._entityKey}|${input.id}|${lensValue}`;
      const cellData = unvisit(this._cellSchema, cpk);
      if (cellData && typeof cellData !== 'symbol') {
        return cellData[input.field];
      }
      return undefined;
    }

    // Values path: input is the compound pk string
    return unvisit(this._cellSchema, input);
  }

  queryKey(args: readonly any[], unvisit: any, delegate: IQueryDelegate): any {
    return undefined;
  }
}
