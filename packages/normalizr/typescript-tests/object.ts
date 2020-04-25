import { normalize, schema } from '../src';
import IDEntity from '../src/entities/IDEntity';

const data = {
  /* ...*/
};
class User extends IDEntity {}

const responseSchema = new schema.Object({
  users: new schema.Array(User.asSchema()),
});
const normalizedData = normalize(data, responseSchema);

const responseSchemaAlt = { users: new schema.Array(User.asSchema()) };
const normalizedDataAlt = normalize(data, responseSchemaAlt);
