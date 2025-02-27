export function getCheckLoop() {
  const visitedEntities = new Map<string, Map<string, object[]>>();
  /* Returns true if a circular reference is found */
  return function checkLoop(entityKey: string, pk: string, input: object) {
    if (!visitedEntities.has(entityKey)) {
      visitedEntities.set(entityKey, new Map<string, object[]>());
    }
    // we have to tell typescript this can't be undefined (due to line above)
    const entitiesOneType: Map<string, object[]> = visitedEntities.get(
      entityKey,
    ) as Map<string, object[]>;

    if (!entitiesOneType.has(pk)) {
      entitiesOneType.set(pk, []);
    }
    const visitedEntityList = entitiesOneType.get(pk) as object[];
    if (visitedEntityList.some((entity: any) => entity === input)) {
      return true;
    }
    visitedEntityList.push(input);
    return false;
  };
}
