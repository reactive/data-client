import { normalize, denormalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import { schema } from '../src';

const data = [
  { id: 1, type: 'admin' },
  { id: 2, type: 'user' },
];
class User extends IDEntity {
  readonly type = 'user';
}
class Admin extends IDEntity {
  readonly type = 'admin';
}

const myArray = new schema.Array(
  {
    admins: User,
    users: Admin,
  },
  (input: User | Admin, parent, key) => `${input.type}s`,
);

const normalizedData = normalize(data, myArray);

const [denormalizedData, found, deleted] = denormalize(
  normalizedData.result,
  myArray,
  normalizedData.entities,
);
if (denormalizedData !== undefined) {
  denormalizedData.forEach(value => {
    value.type;
    value.pk();
    // @ts-expect-error
    value.doesnotexist;
  });
}
