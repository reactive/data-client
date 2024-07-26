import type { Schema, EntityInterface } from './interface.js';
import type { EntityFields } from './schemas/EntityFields.js';
export type SchemaArgs<S extends Schema> = S extends EntityInterface<infer U> ? [EntityFields<U>] : S extends ({
    queryKey(args: infer Args, ...rest: any): any;
}) ? Args : S extends {
    [K: string]: any;
} ? ObjectArgs<S> : never;
export type ObjectArgs<S extends Record<string, any>> = {
    [K in keyof S]: S[K] extends ({
        queryKey(args: infer Args, ...rest: any): any;
    }) ? Args : never;
}[keyof S];
//# sourceMappingURL=schemaArgs.d.ts.map