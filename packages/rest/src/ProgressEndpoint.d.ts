import type {
  RestEndpointConstructorOptions,
  RestEndpoint,
  RestInstanceBase,
  RestGenerics,
} from './RestEndpointTypes.js';

/** Progress event emitted during download.
 * @see https://dataclient.io/rest/api/ProgressEndpoint
 */
export interface DownloadProgress {
  /** Bytes downloaded so far */
  loaded: number;
  /** Total bytes (from Content-Length), or undefined if unknown */
  total: number | undefined;
  /** Whether total is known (false when Content-Length missing or Content-Encoding is set) */
  lengthComputable: boolean;
}

export interface ProgressEndpointConstructor {
  /** RestEndpoint with download progress tracking via ReadableStream.
   *
   * @see https://dataclient.io/rest/api/ProgressEndpoint
   */
  new <O extends RestGenerics = any>({
    method,
    sideEffect,
    name,
    onDownloadProgress,
    ...options
  }: RestEndpointConstructorOptions<O> & Readonly<O>): RestEndpoint<O>;
  readonly prototype: RestInstanceBase;
}

declare let ProgressEndpoint: ProgressEndpointConstructor;
export default ProgressEndpoint;
