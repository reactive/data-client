import type { Fixture, ResponseInterceptor } from './fixtureTypes';

export async function collapseFixture(
  fixture: Fixture | ResponseInterceptor,
  args: any[],
  interceptorData: any,
) {
  let error = 'error' in fixture ? fixture.error : false;
  let response = fixture.response;
  if (typeof fixture.response === 'function') {
    try {
      response = await fixture.response.apply(interceptorData, args);
      // dispatch goes through user-code that can sometimes fail.
      // let's ensure we always handle errors
    } catch (e: any) {
      response = e;
      error = true;
    }
  }
  return { response, error };
}
