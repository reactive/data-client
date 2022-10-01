/** An error with a Rest Endpoint fetch
 *
 * @see https://resthooks.io/rest/api/NetworkError
 */
export default class NetworkError extends Error {
  declare status: number;
  declare response: Response;
  name = 'NetworkError';

  constructor(response: Response) {
    super(
      response.statusText || `Network response not 'ok': ${response.status}`,
    );
    this.status = response.status;
    this.response = response;
  }
}
