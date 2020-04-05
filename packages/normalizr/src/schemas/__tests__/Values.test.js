// eslint-env jest
import { fromJS } from 'immutable';

import { denormalizeSimple as denormalize } from '../../denormalize';
import { normalize, schema } from '../../';
import IDEntity from '../../entities/IDEntity';

describe(`${schema.Values.name} normalization`, () => {
  test('normalizes the values of an object with the given schema', () => {
    class Cat extends IDEntity {}
    class Dog extends IDEntity {}
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      (entity, key) => entity.type,
    );

    expect(
      normalize(
        {
          fido: { id: 1, type: 'dogs' },
          fluffy: { id: 1, type: 'cats' },
        },
        valuesSchema,
      ),
    ).toMatchSnapshot();
  });

  test('can use a function to determine the schema when normalizing', () => {
    class Cat extends IDEntity {}
    class Dog extends IDEntity {}
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      (entity, key) => `${entity.type}s`,
    );

    expect(
      normalize(
        {
          fido: { id: 1, type: 'dog' },
          fluffy: { id: 1, type: 'cat' },
          jim: { id: 2, type: 'lizard' },
        },
        valuesSchema,
      ),
    ).toMatchSnapshot();
  });

  test('filters out null and undefined values', () => {
    class Cat extends IDEntity {}
    class Dog extends IDEntity {}
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      (entity, key) => entity.type,
    );

    expect(
      normalize(
        {
          fido: undefined,
          milo: null,
          fluffy: { id: 1, type: 'cats' },
        },
        valuesSchema,
      ),
    ).toMatchSnapshot();
  });
});

describe(`${schema.Values.name} denormalization`, () => {
  test('denormalizes the values of an object with the given schema', () => {
    class Cat extends IDEntity {}
    class Dog extends IDEntity {}
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      (entity, key) => entity.type,
    );

    const entities = {
      Cat: { 1: { id: 1, type: 'cats' } },
      Dog: { 1: { id: 1, type: 'dogs' } },
    };

    expect(
      denormalize(
        {
          fido: { id: 1, schema: 'dogs' },
          fluffy: { id: 1, schema: 'cats' },
        },
        valuesSchema,
        entities,
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        {
          fido: { id: 1, schema: 'dogs' },
          fluffy: { id: 1, schema: 'cats' },
        },
        valuesSchema,
        fromJS(entities),
      ),
    ).toMatchSnapshot();
  });

  test('denormalizes with missing entity should have false second value', () => {
    class Cat extends IDEntity {}
    class Dog extends IDEntity {}
    const valuesSchema = new schema.Values(
      {
        dogs: Dog,
        cats: Cat,
      },
      (entity, key) => entity.type,
    );

    const entities = {
      Cat: { 1: { id: 1, type: 'cats' } },
      Dog: { 1: { id: 1, type: 'dogs' } },
    };

    expect(
      denormalize(
        {
          fido: { id: 1, schema: 'dogs' },
          fluffy: { id: 1, schema: 'cats' },
          prancy: { id: 5, schema: 'cats' },
        },
        valuesSchema,
        entities,
      ),
    ).toMatchSnapshot();

    expect(
      denormalize(
        {
          fido: { id: 1, schema: 'dogs' },
          fluffy: { id: 1, schema: 'cats' },
          prancy: { id: 5, schema: 'cats' },
        },
        valuesSchema,
        fromJS(entities),
      ),
    ).toMatchSnapshot();
  });
});
