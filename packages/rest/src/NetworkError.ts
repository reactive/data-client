/** An error with a Rest Endpoint fetch
 *
 * @see https://dataclient.io/rest/api/NetworkError
 */
export default class NetworkError extends Error {
  declare status: number;
  declare response: Response;
  name = 'NetworkError';

  constructor(response: Response) {
    super(
      `${response.url}: ${response.statusText || `Status not 'ok': ${response.status}`}`,
    );
    this.status = response.status;
    this.response = response;
  }

  /** Serialize the error for logging and debugging.
   *
   * Error properties are non-enumerable by default, so `JSON.stringify()`
   * on a plain Error produces `{}`. This ensures status, message, and the
   * request URL are always included in serialized output.
   */
  toJSON() {
    return {
      name: this.name,
      status: this.status,
      message: this.message,
      url: this.response.url,
    };
  }
}
