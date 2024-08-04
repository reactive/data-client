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
}
