import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { Union } from '../src';

const data = { owner: { id: 1, type: 'user' } };

class User extends IDEntity {
  readonly type = 'user' as const;
}
class Group extends IDEntity {
  readonly type = 'group' as const;
}

const unionSchema = new Union(
  {
    user: User,
    group: Group,
  },
  'type',
);

const errorUnionSchema = new Union(
  {
    user: User,
    group: Group,
  },
  // @ts-expect-error
  'blob',
);

const normalizedData = normalize({ owner: unionSchema }, data);
