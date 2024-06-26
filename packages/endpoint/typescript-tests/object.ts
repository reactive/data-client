import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { schema } from '../src';

const data = {
  /* ...*/
};
class User extends IDEntity {}

const responseSchema = new schema.Object({
  users: new schema.Array(User),
});
const normalizedData = normalize(responseSchema, data);

const responseSchemaAlt = { users: new schema.Array(User) };
const normalizedDataAlt = normalize(responseSchemaAlt, data);
