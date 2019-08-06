import { ErrorFSAAuto, FSA } from 'flux-standard-action';

export type ErrorableFSAAuto<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined,
  CustomError extends Error = Error
> =
  | ErrorFSAAuto<Type, CustomError, Meta>
  | NoErrorFluxStandardActionAuto<Type, Payload, Meta>;

export interface NoErrorFluxStandardAction<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined
> extends FSA<Type, Payload, Meta> {
  error?: false;
}

/**
 * A Flux Standard action with a required payload property.
 */
export interface NoErrorFluxStandardActionWithPayload<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined
> extends NoErrorFluxStandardAction<Type, Payload, Meta> {
  /**
   * The required `payload` property MAY be any type of value.
   * It represents the payload of the action.
   * Any information about the action that is not the type or status of the action should be part of the `payload` field.
   * By convention, if `error` is `true`, the `payload` SHOULD be an error object.
   * This is akin to rejecting a promise with an error object.
   */
  payload: Payload;
}

/**
 * A Flux Standard action with a required metadata property.
 */
export interface NoErrorFluxStandardActionWithMeta<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined
> extends NoErrorFluxStandardAction<Type, Payload, Meta> {
  /**
   * The required `meta` property MAY be any type of value.
   * It is intended for any extra information that is not part of the payload.
   */
  meta: Meta;
}
/**
 * A Flux Standard action with required payload and metadata properties.
 */
export type NoErrorFluxStandardActionWithPayloadAndMeta<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined
> = NoErrorFluxStandardActionWithPayload<Type, Payload, Meta> &
  NoErrorFluxStandardActionWithMeta<Type, Payload, Meta>;

/**
 * A Flux Standard action with inferred requirements for the payload and metadata properties.
 * The `payload` and `meta` properties will be required if the corresponding type argument
 * if not the `undefined` type.
 */
export type NoErrorFluxStandardActionAuto<
  Type extends string = string,
  Payload = undefined,
  Meta = undefined
> = Payload extends undefined
  ? (Meta extends undefined
      ? NoErrorFluxStandardAction<Type, Payload, Meta>
      : NoErrorFluxStandardActionWithMeta<Type, Payload, Meta>)
  : (Meta extends undefined
      ? NoErrorFluxStandardActionWithPayload<Type, Payload, Meta>
      : NoErrorFluxStandardActionWithPayloadAndMeta<Type, Payload, Meta>);
