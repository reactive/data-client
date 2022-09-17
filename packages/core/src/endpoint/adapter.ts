import type { EndpointInterface } from '@rest-hooks/normalizr';

import type { FetchShape } from './shapes.js';

type ShapeTypeToSideEffect<T extends 'read' | 'mutate' | 'delete' | undefined> =
  T extends 'read' | undefined ? undefined : true;

const SIDEEFFECT_TYPES: (string | undefined)[] = ['mutate', 'delete'];

export default function shapeToEndpoint<
  Shape extends Partial<FetchShape<any, any>>,
>(
  shape: Shape,
): Shape['fetch'] extends (...args: any) => Promise<any>
  ? EndpointInterface<
      Shape['fetch'],
      Shape['schema'],
      ShapeTypeToSideEffect<Shape['type']>
    > &
      Shape['options']
  : Shape['options'] & { key: Shape['getFetchKey'] } {
  // make this identity function for endpoints
  if ((shape as any).key) return shape as any;
  const sideEffect = SIDEEFFECT_TYPES.includes(shape.type);
  const options = {
    ...shape.options,
    key: shape.getFetchKey,
    schema: shape.schema,
    ...((sideEffect && { sideEffect }) as any),
  };
  if (Object.hasOwn(shape, 'fetch')) {
    // simplest form of endpoint without relying on the package
    const endpoint: any = (...args: any) => (shape as any).fetch(...args);
    Object.assign(endpoint, options);
    return endpoint;
  }

  return options as any;
}
