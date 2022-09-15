import type { Schema, Normalize, UpdateFunction } from '@rest-hooks/normalizr';

type ResultStateFromUpdateFunctions<
  SourceSchema extends Schema,
  UpdateFunctions extends {
    [key: string]: UpdateFunction<SourceSchema, any>;
  },
> = { [K in keyof UpdateFunctions]: any };

export default function applyUpdatersToResults<
  SourceSchema extends Schema,
  UpdateFunctions extends {
    [key: string]: UpdateFunction<SourceSchema, any>;
  },
>(
  results: ResultStateFromUpdateFunctions<SourceSchema, UpdateFunctions>,
  result: Normalize<SourceSchema>,
  updaters: UpdateFunctions,
) {
  return {
    ...results,
    ...Object.fromEntries(
      Object.entries(updaters).map(([fetchKey, updater]) => [
        fetchKey,
        updater(result, results[fetchKey]),
      ]),
    ),
  };
}
