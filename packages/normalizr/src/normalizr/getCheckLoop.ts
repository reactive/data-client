export function getCheckLoop() {
  const visitedEntities = {};
  /* Returns true if a circular reference is found */
  return function checkLoop(entityKey: string, pk: string, input: object) {
    if (!(entityKey in visitedEntities)) {
      visitedEntities[entityKey] = {};
    }
    if (!(pk in visitedEntities[entityKey])) {
      visitedEntities[entityKey][pk] = [];
    }
    if (
      visitedEntities[entityKey][pk].some((entity: any) => entity === input)
    ) {
      return true;
    }
    visitedEntities[entityKey][pk].push(input);
    return false;
  };
}
