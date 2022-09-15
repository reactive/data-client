import { normalize, denormalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import { schema } from '../src';

const data = [
  { id: '123', name: 'Jim' },
  { id: '456', name: 'Jane' },
];
class User extends IDEntity {}

const userListSchema = new schema.Array(User);
const normalizedData = normalize(data, userListSchema);

const userListSchemaAlt = [User];
const normalizedDataAlt = normalize(data, userListSchemaAlt);

const denormalizedData = denormalize(
  normalizedData.result,
  userListSchema,
  normalizedData.entities,
);
