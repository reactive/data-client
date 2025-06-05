export function getCheckLoop() {
  const visitedEntities = new Map<string, Map<string, object[]>>();
  /* Returns true if a circular reference is found */
  return function checkLoop(entityKey: string, pk: string, input: object) {
    if (!visitedEntities.has(entityKey)) {
      visitedEntities.set(entityKey, new Map<string, object[]>());
    }
    const entitiesOneType = visitedEntities.get(entityKey)!;

    if (!entitiesOneType.has(pk)) {
      entitiesOneType.set(pk, []);
    }
    const visitedEntityList = entitiesOneType.get(pk)!;

    if (visitedEntityList.some((entity: any) => entity === input)) {
      return true;
    }
    visitedEntityList.push(input);
    return false;
  };
}
