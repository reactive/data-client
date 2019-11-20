import isMergeableObject from './isMergeable';

// Note: the return types are technically not as strict as they could be; but this is sufficient for our local usage.

/**
 * Deep merge two objects or arrays. Uses static merge function if exists.
 */
export default function mergeDeepCopy<T1, T2>(target: T1, source: T2): T1 & T2 {
  const sourceIsArray = Array.isArray(source);
  const targetIsArray = Array.isArray(target);
  const sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
  const Static: StaticType<T2> = source && (source as any).constructor;

  if (target && Static && isMergeable(Static)) {
    if (isMergeable((target as any).constructor)) {
      return Static.merge(target, source) as any;
    } else {
      return source as any;
    }
  } else if (isMergeableObject(source)) {
    // target and source are mergeable
    if (isMergeableObject(target) && sourceAndTargetTypesMatch) {
      const destination: any = targetIsArray
        ? [...(target as any)]
        : { ...target };
      Object.keys(source).forEach(key => {
        destination[key] = mergeDeepCopy(
          destination[key],
          (source as any)[key],
        );
      });
      return destination;
      // not mergeable, but still need to clone source
    } else {
      return mergeDeepCopy(sourceIsArray ? [] : ({} as any), source as any);
    }
  } else if (source === undefined) {
    return target as any;
  }
  return source as any;
}

type StaticType<T> = T extends { constructor: infer U } ? U : undefined;

interface MergeableStatic<T> {
  new (): T;
  merge(a: T, b: T): T;
}

function isMergeable<T>(constructor: any): constructor is MergeableStatic<T> {
  return constructor && typeof constructor.merge === 'function';
}
