import { denormalize, normalize, schema } from '../src';
import IDEntity from '../src/entities/IDEntity';

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
