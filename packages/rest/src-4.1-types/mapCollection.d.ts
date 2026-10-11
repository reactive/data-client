import { Schema, schema } from '@data-client/endpoint';
export default function mapCollection<M extends <C extends schema.Collection>(collection: C) => any, S extends Schema | undefined>(s: S, mapper: M): S extends schema.Collection | schema.Object<any> | {
    [K: string]: any;
} ? MapCollection<M, S> : S;
type MapCollection<M extends <C extends schema.Collection>(collection: C) => any, S extends Schema | undefined> = S extends schema.Collection ? ReturnType<M> : S extends schema.Object<infer T> ? MapObject<M, T> : S extends {
    [K: string]: any;
} ? MapObject<M, S> : never;
export type MapObject<M extends (collection: schema.Collection) => any, S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends Schema ? MapCollection<M, S[K]> : S[K];
};
export {};
