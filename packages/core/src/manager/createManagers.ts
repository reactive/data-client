import type { Manager } from '../types.js';

/** Returns the Managers for one store.
 *
 * A function makes new instances for each store. An array (deprecated) is shared by every store
 * that uses it.
 * @see https://dataclient.io/docs/api/Manager#lifetimes
 */
export default function createManagers(
  managers: (() => Manager[]) | Manager[],
): Manager[] {
  return typeof managers === 'function' ? managers() : managers;
}
