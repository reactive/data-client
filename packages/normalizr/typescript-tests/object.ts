import { normalize, schema } from '../src'

type Response = {
  users: Array<{ id: string }>
}
const data: Response = { users: [ { id: 'foo' } ] };
const user = new schema.Entity('users');

{
  const responseSchema = new schema.Object({ users: new schema.Array(user) });
  const normalizedData = normalize(data, responseSchema);
}

{
  const responseSchema = new schema.Object({ users: (response: Response) => new schema.Array(user) });
  const normalizedData = normalize(data, responseSchema);
}

{
  const responseSchema = { users: new schema.Array(user) };
  const normalizedData = normalize(data, responseSchema);
}