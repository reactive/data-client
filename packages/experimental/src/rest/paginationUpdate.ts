import { Schema } from '@rest-hooks/endpoint';

import getArrayPath from './getArrayPath';

export default function paginationUpdate<
  E extends { schema: Schema; key: any } & ((...args: any) => Promise<any>),
  A extends any[],
>(
  endpoint: E,
  removeCursor: (...args: A) => readonly [...Parameters<typeof endpoint>],
) {
  // infer path from schema. if schema is undefined assume array is top level
  const path = getArrayPath(endpoint.schema);
  if (path === false) throw new Error('schema has no array');

  return (newPage: any, ...args: A) => ({
    [endpoint.key(...(removeCursor(...args) as any))]: (existing: any) => {
      const existingList = getIn(existing, path);
      // using set so our lookups are O(1) in case this is large
      const existingSet: Set<string> = new Set(existingList);
      const addedList = getIn(newPage, path).filter(
        (pk: string) => !existingSet.has(pk),
      );
      const mergedResults: string[] = [...existingList, ...addedList];
      return setIn(existing, path, mergedResults);
    },
  });
}

const getIn = (results: any, path: string[]): any[] => {
  let cur = results;
  for (const p of path) {
    if (!cur) return [];
    cur = cur[p];
  }
  return cur || [];
};

const setIn = <T>(results: T, path: string[], values: any[]): T => {
  if (path.length === 0) return values as any;
  const newResults = { ...results };
  let cur: any = newResults;
  for (let i = 0; i < path.length - 1; i++) {
    const p = path[i];
    cur = cur[p] = { ...cur[p] };
  }
  cur[path[path.length - 1]] = values;
  return newResults;
};
