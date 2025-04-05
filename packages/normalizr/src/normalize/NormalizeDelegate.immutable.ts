// import {
//   EntityTable,
//   NormalizedIndex,
//   INormalizeDelegate,
//   Mergeable,
// } from '../interface.js';
// import { getCheckLoop } from './getCheckLoop.js';
// import { INVALID } from '../denormalize/symbol.js';
// import { DelegateImmutable } from '../memo/Delegate.immutable.js';

// type ImmutableJSEntityTable = {
//   getIn(k: [key: string, pk: string]): { toJS(): any } | undefined;
//   setIn(k: [key: string, pk: string], value: any);
// };
// type ImmutableJSMeta = {
//   getIn(k: [key: string, pk: string]):
//     | {
//         date: number;
//         expiresAt: number;
//         fetchedAt: number;
//       }
//     | undefined;
//   setIn(
//     k: [key: string, pk: string],
//     value: {
//       date: number;
//       expiresAt: number;
//       fetchedAt: number;
//     },
//   );
// };

// export class NormalizeDelegate
//   extends DelegateImmutable
//   implements INormalizeDelegate
// {
//   declare readonly entityMeta: ImmutableJSMeta;

//   declare readonly meta: { fetchedAt: number; date: number; expiresAt: number };
//   declare checkLoop: (entityKey: string, pk: string, input: object) => boolean;

//   protected newEntities = new Map<string, Map<string, any>>();
//   protected newIndexes = new Map<string, Map<string, any>>();

//   constructor(
//     {
//       entities,
//       indexes,
//       entityMeta,
//     }: {
//       entities: ImmutableJSEntityTable;
//       indexes: ImmutableJSEntityTable;
//       entityMeta: ImmutableJSMeta;
//     },
//     actionMeta: { fetchedAt: number; date: number; expiresAt: number },
//   ) {
//     super(entities, indexes);
//     this.entityMeta = entityMeta;
//     this.meta = actionMeta;
//     this.checkLoop = getCheckLoop();
//   }

//   // getNewEntity(key: string, pk: string) {
//   //   return this.getNewEntities(key).get(pk);
//   // }

//   protected getNewEntities(key: string): Map<string, any> {
//     // first time we come across this type of entity
//     if (!this.newEntities.has(key)) {
//       this.newEntities.set(key, new Map());
//     }

//     return this.newEntities.get(key) as Map<string, any>;
//   }

//   protected getNewIndexes(key: string): Map<string, any> {
//     if (!this.newIndexes.has(key)) {
//       this.newIndexes.set(key, new Map());
//     }
//     return this.newIndexes.get(key) as Map<string, any>;
//   }

//   // /** Updates an entity using merge lifecycles when it has previously been set */
//   // mergeEntity(
//   //   schema: Mergeable & { key: string; indexes?: any },
//   //   pk: string,
//   //   incomingEntity: any,
//   // ) {
//   //   const key = schema.key;

//   //   // default when this is completely new entity
//   //   let nextEntity = incomingEntity;
//   //   let nextMeta = this.meta;

//   //   // if we already processed this entity during this normalization (in another nested place)
//   //   let entity = this.getNewEntity(key, pk);
//   //   if (entity) {
//   //     nextEntity = schema.merge(entity, incomingEntity);
//   //   } else {
//   //     // if we find it in the store
//   //     entity = this.getEntity(key, pk);
//   //     if (entity) {
//   //       const meta = this.getMeta(key, pk);
//   //       nextEntity = schema.mergeWithStore(
//   //         meta,
//   //         nextMeta,
//   //         entity,
//   //         incomingEntity,
//   //       );
//   //       nextMeta = schema.mergeMetaWithStore(
//   //         meta,
//   //         nextMeta,
//   //         entity,
//   //         incomingEntity,
//   //       );
//   //     }
//   //   }

//   //   // once we have computed the merged values, set them
//   //   this.setEntity(schema, pk, nextEntity, nextMeta);
//   // }

//   /** Sets an entity overwriting any previously set values */
//   setEntity(
//     schema: { key: string; indexes?: any },
//     pk: string,
//     entity: any,
//     meta: { fetchedAt: number; date: number; expiresAt: number } = this.meta,
//   ) {
//     const key = schema.key;
//     const newEntities = this.getNewEntities(key);
//     const updateMeta = !newEntities.has(pk);
//     newEntities.set(pk, entity);

//     // update index
//     if (schema.indexes) {
//       handleIndexes(
//         pk,
//         schema.indexes,
//         this.getNewIndexes(key),
//         this.indexes[key],
//         entity,
//         this.entities[key] as any,
//       );
//     }

//     // set this after index updates so we know what indexes to remove from
//     (this.entities[key] as any)[pk] = entity;

//     if (updateMeta) this.entityMeta[key][pk] = meta;
//   }

//   protected _setEntity(key: string, pk: string, entity: any) {
//     this.entities.setIn([key, pk], entity);
//   }

//   protected _setMeta(
//     key: string,
//     pk: string,
//     meta: { fetchedAt: number; date: number; expiresAt: number },
//   ) {
//     this.entityMeta.setIn([key, pk], meta);
//   }

//   getMeta(key: string, pk: string) {
//     return this.entityMeta.getIn([key, pk]);
//   }
// }

// function handleIndexes(
//   id: string,
//   schemaIndexes: string[],
//   indexes: Map<string, any>,
//   storeIndexes: Record<string, any>,
//   entity: any,
//   storeEntities: Record<string, any>,
// ) {
//   for (const index of schemaIndexes) {
//     if (!indexes.has(index)) {
//       indexes.set(index, (storeIndexes[index] = {}));
//     }
//     const indexMap = indexes.get(index);
//     if (storeEntities[id]) {
//       delete indexMap[storeEntities[id][index]];
//     }
//     // entity already in cache but the index changed
//     if (
//       storeEntities &&
//       storeEntities[id] &&
//       storeEntities[id][index] !== entity[index]
//     ) {
//       indexMap[storeEntities[id][index]] = INVALID;
//     }
//     if (index in entity) {
//       indexMap[entity[index]] = id;
//     } /* istanbul ignore next */ else if (
//       process.env.NODE_ENV !== 'production'
//     ) {
//       console.warn(`Index not found in entity. Indexes must be top-level members of your entity.
// Index: ${index}
// Entity: ${JSON.stringify(entity, undefined, 2)}`);
//     }
//   }
// }
