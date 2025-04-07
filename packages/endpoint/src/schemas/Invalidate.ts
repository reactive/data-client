import type { EntityInterface, INormalizeDelegate } from '../interface.js';
import { AbstractInstanceType } from '../normal.js';
import { INVALID } from '../special.js';

/**
 * Marks entity as Invalid.
 *
 * This triggers suspense for all endpoints requiring it.
 * Optional (like variable sized Array and Values) will simply remove the item.
 * @see https://dataclient.io/rest/api/Invalidate
 */
// export default interface Invalidate {
//   new <E extends EntityInterface & { process: any }>(entity: E): E;
// }
// export default interface Invalidate<
//   E extends EntityInterface & { process: any },
// > {
//   new (...args: any[]): E;
// }
export default function Invalidate<
  E extends EntityInterface & {
    process: any;
  },
>(entity: E): E {
  if (process.env.NODE_ENV !== 'production' && !entity) {
    throw new Error('Invalidate schema requires "entity" option.');
  }
  return Object.create(entity, {
    normalize: {
      value(
        input: any,
        parent: any,
        key: string | undefined,
        args: any[],
        visit: (...args: any) => any,
        delegate: INormalizeDelegate,
      ): string {
        // TODO: what's store needs to be a differing type from fromJS
        const processedEntity = entity.process(input, parent, key, args);
        let pk = entity.pk(processedEntity, parent, key, args);

        if (
          process.env.NODE_ENV !== 'production' &&
          (pk === undefined || pk === '' || pk === 'undefined')
        ) {
          const error = new Error(
            `Missing usable primary key when normalizing response.
        
          This is likely due to a malformed response.
          Try inspecting the network response or fetch() return value.
          Or use debugging tools: https://dataclient.io/docs/getting-started/debugging
          Learn more about schemas: https://dataclient.io/docs/api/schema
        
          Invalidate(Entity): Invalidate(${this._entity.key})
          Value (processed): ${input && JSON.stringify(input, null, 2)}
          `,
          );
          (error as any).status = 400;
          throw error;
        }
        pk = `${pk}`; // ensure pk is a string

        // any queued updates are meaningless with delete, so we should just set it
        // and creates will have a different pk
        delegate.setEntity(this as any, pk, INVALID);
        return pk;
      },
    },
  });
}
// export default class Invalidate<
//   E extends EntityInterface & {
//     process: any;
//   },
// > implements SchemaSimple
// {
//   declare protected _entity: E;

//   /**
//    * Marks entity as Invalid.
//    *
//    * This triggers suspense for all endpoints requiring it.
//    * Optional (like variable sized Array and Values) will simply remove the item.
//    * @see https://dataclient.io/rest/api/Invalidate
//    */
//   constructor(entity: E) {
//     if (process.env.NODE_ENV !== 'production' && !entity) {
//       throw new Error('Invalidate schema requires "entity" option.');
//     }
//     this._entity = entity;
//   }

//   get key() {
//     return this._entity.key;
//   }

//   normalize(
//     input: any,
//     parent: any,
//     key: string | undefined,
//     args: any[],
//     visit: (...args: any) => any,
//     delegate: INormalizeDelegate,
//   ): string {
//     // TODO: what's store needs to be a differing type from fromJS
//     const processedEntity = this._entity.process(input, parent, key, args);
//     let pk = this._entity.pk(processedEntity, parent, key, args);

//     if (
//       process.env.NODE_ENV !== 'production' &&
//       (pk === undefined || pk === '' || pk === 'undefined')
//     ) {
//       const error = new Error(
//         `Missing usable primary key when normalizing response.

//   This is likely due to a malformed response.
//   Try inspecting the network response or fetch() return value.
//   Or use debugging tools: https://dataclient.io/docs/getting-started/debugging
//   Learn more about schemas: https://dataclient.io/docs/api/schema

//   Invalidate(Entity): Invalidate(${this._entity.key})
//   Value (processed): ${input && JSON.stringify(input, null, 2)}
//   `,
//       );
//       (error as any).status = 400;
//       throw error;
//     }
//     pk = `${pk}`; // ensure pk is a string

//     // any queued updates are meaningless with delete, so we should just set it
//     // and creates will have a different pk
//     delegate.setEntity(this as any, pk, INVALID);
//     return pk;
//   }

//   queryKey(args: any, unvisit: unknown, delegate: unknown): undefined {
//     return undefined;
//   }

//   denormalize(
//     id: string,
//     args: readonly any[],
//     unvisit: (schema: any, input: any) => any,
//   ): AbstractInstanceType<E> {
//     return unvisit(this._entity, id) as any;
//   }

//   /* istanbul ignore next */
//   _denormalizeNullable(): AbstractInstanceType<E> | undefined {
//     return {} as any;
//   }

//   /* istanbul ignore next */
//   _normalizeNullable(): string | undefined {
//     return {} as any;
//   }
// }
