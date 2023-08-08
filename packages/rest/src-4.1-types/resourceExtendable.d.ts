import type { EndpointInterface, EndpointToFunction } from '@data-client/endpoint';
import type { ResourcePath } from './pathTypes.js';
import type { ResourceExtension, ResourceEndpointExtensions, CustomResource, ExtendedResource } from './resourceExtensionTypes.js';
import type { ResourceGenerics, ResourceInterface } from './resourceTypes.js';
import type { PartialRestGenerics, RestEndpointExtendOptions, RestExtendedEndpoint, RestInstanceBase } from './RestEndpoint.js';
export interface Extendable<O extends ResourceGenerics = {
    path: ResourcePath;
    schema: any;
}> {
    extend<R extends {
        [K in ExtendKey]: RestInstanceBase;
    }, ExtendKey extends Exclude<Extract<keyof R, string>, 'extend'>, ExtendOptions extends PartialRestGenerics | {}>(this: R, key: ExtendKey, options: Readonly<RestEndpointExtendOptions<ExtendOptions, R[ExtendKey], EndpointToFunction<R[ExtendKey]>> & ExtendOptions>): ResourceExtension<R, ExtendKey, ExtendOptions>;
    extend<R extends {
        get: RestInstanceBase;
    }, ExtendKey extends string, ExtendOptions extends PartialRestGenerics | {}>(this: R, key: ExtendKey, options: Readonly<RestEndpointExtendOptions<ExtendOptions, R['get'], EndpointToFunction<R['get']>> & ExtendOptions>): R & {
        [key in ExtendKey]: RestExtendedEndpoint<ExtendOptions, R['get']>;
    };
    extend<R extends ResourceInterface, Get extends PartialRestGenerics = any, GetList extends PartialRestGenerics = any, Update extends PartialRestGenerics = any, PartialUpdate extends PartialRestGenerics = any, Delete extends PartialRestGenerics = any>(this: R, options: ResourceEndpointExtensions<R, Get, GetList, Update, PartialUpdate, Delete>): CustomResource<R, O, Get, GetList, Update, PartialUpdate, Delete>;
    extend<R extends ResourceInterface, T extends Record<string, EndpointInterface>>(this: R, extender: (baseResource: R) => T): ExtendedResource<R, T>;
}
//# sourceMappingURL=resourceExtendable.d.ts.map