// we just removed instances of 'abstract new'
import { AbstractInstanceType } from '../normal.js';
declare const Entity_base: import("./EntityTypes.js").IEntityClass<new (...args: any[]) => {
    pk(parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
}> & (new (...args: any[]) => {
    pk(parent?: any, key?: string, args?: readonly any[]): string | number | undefined;
});
/**
 * Entity defines a single (globally) unique object.
 * @see https://dataclient.io/rest/api/Entity
 */
export default abstract class Entity extends Entity_base {
    /** Control how automatic schema validation is handled
     *
     * `undefined`: Defaults - throw error in worst offense
     * 'warn': only ever warn
     * 'silent': Don't bother with processing at all
     *
     * Note: this only applies to non-nested members.
     */
    protected static automaticValidation?: 'warn' | 'silent';
    /** Factory method to convert from Plain JS Objects.
     *
     * @see https://dataclient.io/rest/api/Entity#fromJS
     * @param [props] Plain Object of properties to assign.
     */
    static fromJS: <T extends typeof Entity>(this: T, props?: Partial<AbstractInstanceType<T>>) => AbstractInstanceType<T>;
    /**
     * A unique identifier for each Entity
     *
     * @see https://dataclient.io/rest/api/Entity#pk
     * @param [value] POJO of the entity or subset used
     * @param [parent] When normalizing, the object which included the entity
     * @param [key] When normalizing, the key where this entity was found
     * @param [args] ...args sent to Endpoint
     */
    static pk: <T extends typeof Entity>(this: T, value: Partial<AbstractInstanceType<T>>, parent?: any, key?: string, args?: any[]) => string | number | undefined;
    /** Do any transformations when first receiving input
     *
     * @see https://dataclient.io/rest/api/Entity#process
     */
    static process(input: any, parent: any, key: string | undefined, args: any[]): any;
    static denormalize: <T extends typeof Entity>(this: T, input: any, args: readonly any[], unvisit: (schema: any, input: any) => any) => AbstractInstanceType<T>;
}
export {};
