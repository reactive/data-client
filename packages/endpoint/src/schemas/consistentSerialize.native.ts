/** This serializes in consistent way even if members are added in differnet orders */
export function consistentSerialize(obj: Record<string, unknown>) {
  let keys = Object.keys(obj);
  // sort doesn't always work in RN
  try {
    keys = keys.sort();
    // eslint-disable-next-line no-empty
  } catch {}
  const sortedObj: Record<string, unknown> = {};

  for (const key of keys) {
    sortedObj[key] = obj[key];
  }

  return JSON.stringify(sortedObj);
}
