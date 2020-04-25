import { normalize, schema } from '../src';
import IDEntity from '../src/entities/IDEntity';

const data = { owner: { id: 1, type: 'user' } };

class User extends IDEntity {
  readonly type = 'user' as const;
}
class Group extends IDEntity {
  readonly type = 'group' as const;
}

const unionSchema = new schema.Union(
  {
    user: User.asSchema(),
    group: Group.asSchema(),
  },
  'type',
);

const errorUnionSchema = new schema.Union(
  {
    user: User.asSchema(),
    group: Group.asSchema(),
  },
  // @ts-expect-error
  'blob',
);

const normalizedData = normalize(data, { owner: unionSchema });
