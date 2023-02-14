import type { Fixture, Interceptor } from './fixtureTypes.js';

export function collapseFixture(
  fixture: Fixture | Interceptor,
  args: any[],
  interceptorData: any,
) {
  let error = 'error' in fixture ? fixture.error : false;
  let response = fixture.response;
  if (typeof fixture.response === 'function') {
    try {
      response = fixture.response.apply(interceptorData, args);
      // dispatch goes through user-code that can sometimes fail.
      // let's ensure we always handle errors
    } catch (e: any) {
      response = e;
      error = true;
    }
  }
  return { response, error };
}
