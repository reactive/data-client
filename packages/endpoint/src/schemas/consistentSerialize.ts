/** This serializes in consistent way even if members are added in differnet orders */
export function consistentSerialize(obj: Record<string, unknown>) {
  const keys = Object.keys(obj).sort();
  const sortedObj: Record<string, unknown> = {};

  for (const key of keys) {
    sortedObj[key] = obj[key];
  }

  return JSON.stringify(sortedObj);
}
