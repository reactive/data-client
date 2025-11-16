import type { Fixture, Interceptor } from './fixtureTypes.js';

export function createFixtureMap(fixtures: (Fixture | Interceptor)[] = []) {
  const map: Map<string, Fixture> = new Map();
  const computed: Interceptor[] = [];
  for (const fixture of fixtures) {
    if ('args' in fixture) {
      if (typeof fixture.response !== 'function') {
        const key = fixture.endpoint.key(...fixture.args);
        map.set(key, fixture);
      } else {
        // this has to be a typo. probably needs to remove args
        console.warn(
          `Fixture found with function response, and explicit args. Interceptors should not specify args.
${fixture.endpoint.name}: ${JSON.stringify(fixture.args)}

Treating as Interceptor`,
        );
        computed.push(fixture as any);
      }
    } else {
      computed.push(fixture);
    }
  }
  return [map, computed] as const;
}
