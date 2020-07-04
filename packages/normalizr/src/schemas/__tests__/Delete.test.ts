// eslint-env jest
import { fromJS } from 'immutable';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema } from '../../';
import IDEntity from '../../entities/IDEntity';

describe(`${schema.Delete.name} normalization`, () => {
  test('throws if not given an entity', () => {
    // @ts-expect-error
    expect(() => new schema.Delete()).toThrow();
  });

  test('normalizes an object using string schemaAttribute', () => {
    class User extends IDEntity {}

    expect(
      normalize({ id: '1', type: 'users' }, new schema.Delete(User)),
    ).toMatchSnapshot();
  });
});
