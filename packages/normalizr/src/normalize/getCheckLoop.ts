export function getCheckLoop() {
  const visitedEntities = new Map<string, Map<string, Set<object>>>();
  /* Returns true if a circular reference is found */
  return function checkLoop(entityKey: string, pk: string, input: object) {
    let entitiesOneType = visitedEntities.get(entityKey);
    if (!entitiesOneType) {
      entitiesOneType = new Map<string, Set<object>>();
      visitedEntities.set(entityKey, entitiesOneType);
    }

    let visitedEntitySet = entitiesOneType.get(pk);
    if (!visitedEntitySet) {
      visitedEntitySet = new Set<object>();
      entitiesOneType.set(pk, visitedEntitySet);
    }

    if (visitedEntitySet.has(input)) {
      return true;
    }
    visitedEntitySet.add(input);
    return false;
  };
}
