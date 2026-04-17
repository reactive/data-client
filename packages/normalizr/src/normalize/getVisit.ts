import type { INormalizeDelegate } from '../interface.js';
import { normalize as arrayNormalize } from '../schemas/Array.js';
import { normalize as objectNormalize } from '../schemas/Object.js';

export const getVisit = (delegate: INormalizeDelegate) => {
  // Tracks the nearest enclosing entity-like schema so nested schemas (e.g.
  // Scalar) can read their entity context via the 7th arg passed to
  // schema.normalize. A closure variable is used (rather than a property on
  // `delegate`) because cycling distinct Entity subclasses through a single
  // property pollutes its inline cache and propagates polymorphic access into
  // inlined call sites, deoptimizing the normalize hot path.
  let currentEntity: any = undefined;

  const visit = (
    schema: any,
    value: any,
    parent: any,
    key: any,
    args: readonly any[],
  ) => {
    if (value == null || !schema) return value;

    // Primitive value: most schemas just pass it through. Two exceptions:
    //  - Entity-by-id references (`schema.pk`): coerce truthy ids to string;
    //    falsy ids pass through verbatim as "no reference" (legacy behavior).
    //  - Schemas opting in via `acceptsPrimitives` (e.g. Scalar) receive the
    //    value — including falsy primitives like `0` — via `.normalize`.
    if (typeof value !== 'object') {
      if (typeof schema.normalize !== 'function') return value;
      if (!schema.acceptsPrimitives) {
        return value && schema.pk ? `${value}` : value;
      }
    }

    if (typeof schema.normalize === 'function') {
      const prev = currentEntity;
      if (schema.pk) currentEntity = schema;
      const result = schema.normalize(
        value,
        parent,
        key,
        args,
        visit,
        delegate,
        prev,
      );
      currentEntity = prev;
      return result;
    }

    if (typeof schema !== 'object') return value;

    const method = Array.isArray(schema) ? arrayNormalize : objectNormalize;
    return method(schema, value, parent, key, args, visit);
  };
  return visit;
};
