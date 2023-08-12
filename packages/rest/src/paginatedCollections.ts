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
    const noCursorArgs = removeCursor(...args)[0] ?? {};
    return (collectionKey: Record<string, string>) =>
      shallowEqual(collectionKey, noCursorArgs);
  };

function shallowEqual(
  object1: Record<string, any>,
  object2: Record<string, any>,
) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);
  let length2 = 0;
  for (const key of keys2) {
    // we should ignore any members with value undefined
    if (object2[key] === undefined) continue;
    if (object1[key] !== `${object2[key]}`) {
      return false;
    }
    length2++;
  }
  if (keys1.length !== length2) {
    return false;
  }
  return true;
}
