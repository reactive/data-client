export function paginatedMerge(existing: any[], incoming: any[]) {
  const existingSet: Set<string> = new Set(existing);
  const mergedList = [...existing];
  for (const pk of incoming) {
    if (!existingSet.has(pk)) mergedList.push(pk);
  }
  return mergedList;
}
export const paginatedFilter =
  <C extends (...args: readonly any[]) => readonly any[]>(removeCursor: C) =>
  (...args: Parameters<C>) => {
    const noCursorArgs = removeCursor(...args);
    return (collectionKey: Record<string, any>) =>
      shallowEqual(collectionKey, noCursorArgs[0] ?? {});
  };

function shallowEqual(
  object1: Record<string, any>,
  object2: Record<string, any>,
) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (object1[key] != object2[key]) {
      return false;
    }
  }
  return true;
}
