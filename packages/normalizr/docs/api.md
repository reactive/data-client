# API

- [normalize](#normalizedata-schema)
- [denormalize](#denormalizeinput-schema-entities)
- [schema](#schema)
  - [Array](#arraydefinition-schemaattribute)
  - [Entity](#entitykey-definition---options--)
  - [Object](#objectdefinition)
  - [Union](#uniondefinition-schemaattribute)
  - [Values](#valuesdefinition-schemaattribute)

## `normalize(schema, data, args?, prevState?, meta?)`

Normalizes input data per the schema definition provided.

- `schema`: **required** A schema definition
- `data`: **required** Input JSON (or plain JS object) data that needs normalization.
- `args`: Array of args to use in lookups for mutable/querable types like Entity and Collection

### Usage

```js
import { schema } from '@data-client/endpoint';
import { normalize } from '@data-client/normalizr';

const myData = { users: [{ id: 1 }, { id: 2 }] };
class User { id = 0 }
const userSchema = new schema.EntityMixin(User);
const mySchema = { users: [userSchema] };
const normalizedData = normalize(mySchema, myData);
```

### Output

```js
{
  result: { users: [ 1, 2 ] },
  entities: {
    User: {
      '1': { id: 1 },
      '2': { id: 2 }
    }
  }
}
```

## `denormalize(schema, input, entities)`

Denormalizes an input based on schema and provided entities from a plain object or Immutable data. The reverse of `normalize`.

If your schema and data have recursive references, only the first instance of an entity will be given. Subsequent references will be returned as the `id` provided.

- `schema`: **required** A schema definition that was used to get the value for `input`.
- `input`: **required** The normalized result that should be _de-normalized_. Usually the same value that was given in the `result` key of the output of `normalize`.
- `entities`: **required** An object, keyed by entity schema names that may appear in the denormalized output. Also accepts an object with Immutable data.

### Usage

```js
import { schema } from '@data-client/endpoint';
import { denormalize } from '@data-client/normalizr';

class User { id = 0 }
const userSchema = new schema.EntityMixin(User);
const mySchema = { users: [userSchema] };
const entities = { User: { '1': { id: 1 }, '2': { id: 2 } } };
const denormalizedData = denormalize(mySchema, { users: [1, 2] }, entities);
```

### Output

```js
{
  users: [User { id: 1 }, User { id: 2 }];
}
```

## `schema`

Available from [@data-client/endpoint](https://www.npmjs.com/package/@data-client/endpoint)

<table>
<thead>
<tr>
<th>Data Type</th>
<th>Mutable</th>
<th>Schema</th>
<th>Description</th>
<th><a href="https://dataclient.io/rest/api/schema#queryable">Queryable</a></th>
</tr>
</thead>
<tbody><tr>
<td rowSpan="4"><a href="https://en.wikipedia.org/wiki/Object_(computer_science)">Object</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Entity">Entity</a></td>
<td>single <em>unique</em> object</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Union">Union(Entity)</a></td>
<td>polymorphic objects (<code>A | B</code>)</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Object">Object</a></td>
<td>statically known keys</td>
<td align="center">🛑</td>
</tr>
<tr>
<td align="center"></td>
<td><a href="https://dataclient.io/rest/api/Invalidate">Invalidate(Entity)</a></td>
<td><a href="https://dataclient.io/docs/concepts/expiry-policy#invalidate-entity">delete an entity</a></td>
<td align="center">🛑</td>
</tr>
<tr>
<td rowSpan="3"><a href="https://en.wikipedia.org/wiki/List_(abstract_data_type)">List</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Collection">Collection(Array)</a></td>
<td>growable lists</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Array">Array</a></td>
<td>immutable lists</td>
<td align="center">🛑</td>
</tr>
<tr>
<td align="center"> </td>
<td><a href="https://dataclient.io/rest/api/All">All</a></td>
<td>list of all entities of a kind</td>
<td align="center">✅</td>
</tr>
<tr>
<td rowSpan="2"><a href="https://en.wikipedia.org/wiki/Associative_array">Map</a></td>
<td align="center">✅</td>
<td><a href="https://dataclient.io/rest/api/Collection">Collection(Values)</a></td>
<td>growable maps</td>
<td align="center">✅</td>
</tr>
<tr>
<td align="center">🛑</td>
<td><a href="https://dataclient.io/rest/api/Values">Values</a></td>
<td>immutable maps</td>
<td align="center">🛑</td>
</tr>
<tr>
<td>any</td>
<td align="center"></td>
<td><a href="https://dataclient.io/rest/api/Query">Query(Queryable)</a></td>
<td>memoized custom transforms</td>
<td align="center">✅</td>
</tr>
</tbody></table>

### `Array(definition, schemaAttribute)`

Creates a schema to normalize an array of schemas. If the input value is an `Object` instead of an `Array`, the normalized result will be an `Array` of the `Object`'s values.

_Note: The same behavior can be defined with shorthand syntax: `[ mySchema ]`_

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.  
  Can be a string or a function. If given a function, accepts the following arguments:  
   _ `value`: The input value of the entity.
  _ `parent`: The parent object of the input array. \* `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Array` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

To describe a simple array of a singular entity type:

```js
import { schema } from '@data-client/endpoint';

const data = [{ id: '123', name: 'Jim' }, { id: '456', name: 'Jane' }];
const userSchema = new schema.EntityMixin(class User {id='';name='';});

const userListSchema = new schema.Array(userSchema);
// or use shorthand syntax:
const userListSchema = [userSchema];

const normalizedData = normalize(userListSchema, data);
```

#### Output

```js
{
  entities: {
    User: {
      '123': { id: '123', name: 'Jim' },
      '456': { id: '456', name: 'Jane' }
    }
  },
  result: [ '123', '456' ]
}
```

If your input data is an array of more than one type of entity, it is necessary to define a schema mapping.

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

For example:

```js
import { schema } from '@data-client/endpoint';

const data = [{ id: 1, type: 'admin' }, { id: 2, type: 'user' }];

const userSchema = new schema.EntityMixin(class User {id='';type='user';});
const adminSchema = new schema.EntityMixin(class Admin {id='';type='admin';});
const myArray = new schema.Array(
  {
    admins: adminSchema,
    users: userSchema
  },
  (input, parent, key) => `${input.type}s`
);

const normalizedData = normalize(myArray, data);
```

#### Output

```js
{
  entities: {
    Admin: { '1': { id: 1, type: 'admin' } },
    User: { '2': { id: 2, type: 'user' } }
  },
  result: [
    { id: 1, schema: 'admins' },
    { id: 2, schema: 'users' }
  ]
}
```

### `Entity(key, definition = {}, options = {})`

- `key`: **required** The key name under which all entities of this type will be listed in the normalized response. Must be a string name.
- `definition`: A definition of the nested entities found within this entity. Defaults to empty object.  
  You _do not_ need to define any keys in your entity other than those that hold nested entities. All other values will be copied to the normalized entity's output.
- `options`:
  - `idAttribute`: The attribute where unique IDs for each of this entity type can be found.  
    Accepts either a string `key` or a function that returns the IDs `value`. Defaults to `'id'`.  
    As a function, accepts the following arguments, in order:
    - `value`: The input value of the entity.
    - `parent`: The parent object of the input array.
    - `key`: The key at which the input array appears on the parent object.
  - `mergeStrategy(entityA, entityB)`: Strategy to use when merging two entities with the same `id` value. Defaults to merge the more recently found entity onto the previous.
  - `processStrategy(value, parent, key)`: Strategy to use when pre-processing the entity. Use this method to add extra data, defaults, and/or completely change the entity before normalization is complete. Defaults to returning a shallow copy of the input entity.  
    _Note: It is recommended to always return a copy of your input and not modify the original._  
    The function accepts the following arguments, in order:
    - `value`: The input value of the entity.
    - `parent`: The parent object of the input array.
    - `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Entity` constructor. This method tends to be useful for creating circular references in schema.

#### Instance Attributes

- `key`: Returns the key provided to the constructor.
- `idAttribute`: Returns the idAttribute provided to the constructor in options.

#### Usage

```js
const data = { id_str: '123', url: 'https://twitter.com', user: { id_str: '456', name: 'Jimmy' } };

const user = new schema.Entity('users', {}, { idAttribute: 'id_str' });
const tweet = new schema.Entity(
  'tweets',
  { user: user },
  {
    idAttribute: 'id_str',
    // Apply everything from entityB over entityA, except for "favorites"
    mergeStrategy: (entityA, entityB) => ({
      ...entityA,
      ...entityB,
      favorites: entityA.favorites
    }),
    // Remove the URL field from the entity
    processStrategy: (entity) => omit(entity, 'url')
  }
);

const normalizedData = normalize(tweet, data);
```

#### Output

```js
{
  entities: {
    tweets: { '123': { id_str: '123', user: '456' } },
    users: { '456': { id_str: '456', name: 'Jimmy' } }
  },
  result: '123'
}
```

#### `idAttribute` Usage

When passing the `idAttribute` a function, it should return the IDs value.

For Example:

```js
const data = [{ id: '1', guest_id: null, name: 'Esther' }, { id: '1', guest_id: '22', name: 'Tom' }];

const patronsSchema = new schema.Entity('patrons', undefined, {
  // idAttribute *functions* must return the ids **value** (not key)
  idAttribute: (value) => (value.guest_id ? `${value.id}-${value.guest_id}` : value.id)
});

normalize([patronsSchema], data);
```

#### Output

```js
{
  entities: {
    patrons: {
      '1': { id: '1', guest_id: null, name: 'Esther' },
      '1-22': { id: '1', guest_id: '22', name: 'Tom' },
    }
  },
  result: ['1', '1-22']
}
```

### `Object(definition)`

Define a plain object mapping that has values needing to be normalized into Entities. _Note: The same behavior can be defined with shorthand syntax: `{ ... }`_

- `definition`: **required** A definition of the nested entities found within this object. Defaults to empty object.  
  You _do not_ need to define any keys in your object other than those that hold other entities. All other values will be copied to the normalized output.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Object` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

```js
// Example data response
const data = { users: [{ id: '123', name: 'Beth' }] };

const user = new schema.Entity('users');
const responseSchema = new schema.Object({ users: new schema.Array(user) });
// or shorthand
const responseSchema = { users: new schema.Array(user) };

const normalizedData = normalize(responseSchema, data);
```

#### Output

```js
{
  entities: {
    users: { '123': { id: '123', name: 'Beth' } }
  },
  result: { users: [ '123' ] }
}
```

### `Union(definition, schemaAttribute)`

Describe a schema which is a union of multiple schemas. This is useful if you need the polymorphic behavior provided by `schema.Array` or `schema.Values` but for non-collection fields.

- `definition`: **required** An object mapping the definition of the nested entities found within the input array
- `schemaAttribute`: **required** The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.  
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Union` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

```js
const data = { owner: { id: 1, type: 'user', name: 'Anne' } };

const user = new schema.Entity('users');
const group = new schema.Entity('groups');
const unionSchema = new schema.Union(
  {
    user: user,
    group: group
  },
  'type'
);

const normalizedData = normalize({ owner: unionSchema }, data);
```

#### Output

```js
{
  entities: {
    users: { '1': { id: 1, type: 'user', name: 'Anne' } }
  },
  result: { owner: { id: 1, schema: 'user' } }
}
```

### `Values(definition, schemaAttribute)`

Describes a map whose values follow the given schema.

- `definition`: **required** A singular schema that this array contains _or_ a mapping of schema to attribute values.
- `schemaAttribute`: _optional_ (required if `definition` is not a singular schema) The attribute on each entity found that defines what schema, per the definition mapping, to use when normalizing.  
  Can be a string or a function. If given a function, accepts the following arguments:
  - `value`: The input value of the entity.
  - `parent`: The parent object of the input array.
  - `key`: The key at which the input array appears on the parent object.

#### Instance Methods

- `define(definition)`: When used, the `definition` passed in will be merged with the original definition passed to the `Values` constructor. This method tends to be useful for creating circular references in schema.

#### Usage

```js
const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };

const item = new schema.Entity('items');
const valuesSchema = new schema.Values(item);

const normalizedData = normalize(valuesSchema, data);
```

#### Output

```js
{
  entities: {
    items: { '1': { id: 1 }, '2': { id: 2 } }
  },
  result: { firstThing: 1, secondThing: 2 }
}
```

If your input data is an object that has values of more than one type of entity, but their schema is not easily defined by the key, you can use a mapping of schema, much like `schema.Union` and `schema.Array`.

_Note: If your data returns an object that you did not provide a mapping for, the original object will be returned in the result and an entity will not be created._

For example:

```js
import { schema } from '@data-client/endpoint';

const data = {
  '1': { id: 1, type: 'admin' },
  '2': { id: 2, type: 'user' }
};

const userSchema = new schema.Entity('users');
const adminSchema = new schema.Entity('admins');
const valuesSchema = new schema.Values(
  {
    admins: adminSchema,
    users: userSchema
  },
  (input, parent, key) => `${input.type}s`
);

const normalizedData = normalize(valuesSchema, data);
```

#### Output

```js
{
  entities: {
    admins: { '1': { id: 1, type: 'admin' } },
    users: { '2': { id: 2, type: 'user' } }
  },
  result: {
    '1': { id: 1, schema: 'admins' },
    '2': { id: 2, schema: 'users' }
  }
}
```
