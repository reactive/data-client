export default function validateRequired(
  processedEntity: any,
  requiredDefaults: Record<string, unknown>,
): string | undefined {
  let missingKey = '';
  if (
    Object.keys(requiredDefaults).some(key => {
      if (!Object.hasOwn(processedEntity, key)) {
        missingKey = key;
        return true;
      }
      return false;
    })
  ) {
    return `Missing key ${missingKey}`;
  }
}
