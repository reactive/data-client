import type { Fixture, Interceptor } from './fixtureTypes.js';

export function createFixtureMap(fixtures: (Fixture | Interceptor)[] = []) {
  const map: Record<string, Fixture> = {};
  const computed: Interceptor[] = [];
  for (const fixture of fixtures) {
    if ('args' in fixture) {
      const key = fixture.endpoint.key(...fixture.args);
      map[key] = fixture;
    } else {
      computed.push(fixture);
    }
  }
  return [map, computed] as const;
}
