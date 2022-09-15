import { normalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import { schema } from '../src';

const data = {
  /* ...*/
};
class User extends IDEntity {}

const responseSchema = new schema.Object({
  users: new schema.Array(User),
});
const normalizedData = normalize(data, responseSchema);

const responseSchemaAlt = { users: new schema.Array(User) };
const normalizedDataAlt = normalize(data, responseSchemaAlt);
