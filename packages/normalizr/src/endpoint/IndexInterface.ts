import type { AbstractInstanceType } from '../types.js';
import type { Schema } from '../interface.js';

export interface IndexInterface<S extends Schema = Schema, P = object> {
  key(params?: P): string;
  readonly schema: S;
}

export type ArrayElement<ArrayType extends unknown[] | readonly unknown[]> =
  ArrayType[number];

export type IndexParams<S extends Schema> = S extends {
  indexes: readonly string[];
}
  ? {
      [K in Extract<
        ArrayElement<S['indexes']>,
        keyof AbstractInstanceType<S>
      >]?: AbstractInstanceType<S>[K];
    }
  : Readonly<object>;
