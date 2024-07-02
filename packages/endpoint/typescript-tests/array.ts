import { normalize, denormalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { schema } from '../src';

const data = [
  { id: '123', name: 'Jim' },
  { id: '456', name: 'Jane' },
];
class User extends IDEntity {}

const userListSchema = new schema.Array(User);
const normalizedData = normalize(userListSchema, data);

const userListSchemaAlt = [User];
const normalizedDataAlt = normalize(userListSchemaAlt, data);

const denormalizedData = denormalize(
  userListSchema,
  normalizedData.result,
  normalizedData.entities,
);
