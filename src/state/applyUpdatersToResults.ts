import { UpdateFunction } from '~/types';
import { ResultType, Schema } from '~/resource/normal';

type ResultStateFromUpdateFunctions<
  SourceSchema extends Schema,
  UpdateFunctions extends {
    [key: string]: UpdateFunction<SourceSchema, any>;
  }
> = { [K in keyof UpdateFunctions]: any };

export default function applyUpdatersToResults<
  SourceSchema extends Schema,
  UpdateFunctions extends {
    [key: string]: UpdateFunction<SourceSchema, any>;
  }
>(
  results: ResultStateFromUpdateFunctions<SourceSchema, UpdateFunctions>,
  result: ResultType<SourceSchema>,
  updaters: UpdateFunctions | undefined,
) {
  if (!updaters) return results;
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
