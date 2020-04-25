import { denormalize, normalize, schema, Entity } from '../src';
import IDEntity from '../src/entities/IDEntity';

const data = [
  { id: 1, type: 'admin' },
  { id: 2, type: 'user' },
];
class User extends IDEntity {}
class Admin extends IDEntity {}

const myArray = new schema.Array(
  {
    admins: User,
    users: Admin,
  },
  (input, parent, key) => `${input.type}s`,
);

const normalizedData = normalize(data, myArray);

const denormalizedData = denormalize(
  normalizedData.result,
  myArray,
  normalizedData.entities,
);
