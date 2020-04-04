import { ArticleResource } from '__tests__/common';

import React from 'react';

import mergeDeepCopy from '../merge/mergeDeepCopy';
import isMergeable from '../merge/isMergeable';

describe('mergeDeepCopy()', () => {
  describe('with instance.constructor.merge()', () => {
    it('should merge two Resource instances', () => {
      const id = 20;
      const a = ArticleResource.fromJS({
        id,
        title: 'hi',
        content: 'this is the content',
      });
      const b = ArticleResource.fromJS({ id, title: 'hello' });

      const merged = mergeDeepCopy(a, b);
      expect(merged).toBeInstanceOf(ArticleResource);
      expect(merged).toEqual(
        ArticleResource.fromJS({
          id,
          title: 'hello',
          content: 'this is the content',
        }),
      );
    });
    it('should handle merging of Resource instances when used with lodash.mergeWith()', () => {
      const id = 20;
      const entitiesA = {
        [ArticleResource.key]: {
          [id]: ArticleResource.fromJS({
            id,
            title: 'hi',
            content: 'this is the content',
          }),
        },
      };
      const entitiesB = {
        [ArticleResource.key]: {
          [id]: ArticleResource.fromJS({ id, title: 'hello' }),
        },
      };

      const merged = mergeDeepCopy(entitiesA, entitiesB);
      expect(merged[ArticleResource.key][id]).toBeInstanceOf(ArticleResource);
      expect(merged[ArticleResource.key][id]).toEqual(
        ArticleResource.fromJS({
          id,
          title: 'hello',
          content: 'this is the content',
        }),
      );
    });
    it('should not affect merging of plain objects when used with lodash.mergeWith()', () => {
      const id = 20;
      const entitiesA = {
        [ArticleResource.key]: {
          [id]: ArticleResource.fromJS({
            id,
            title: 'hi',
            content: 'this is the content',
          }),
          [42]: ArticleResource.fromJS({
            id: 42,
            title: 'dont touch me',
            content: 'this is mine',
          }),
        },
      };
      const entitiesB = {
        [ArticleResource.key]: {
          [id]: ArticleResource.fromJS({
            id,
            title: 'hi',
            content: 'this is the content',
          }),
        },
      };

      const merged = mergeDeepCopy(entitiesA, entitiesB);
      expect(merged[ArticleResource.key][42]).toBe(
        entitiesA[ArticleResource.key][42],
      );
    });
  });

  describe('basics', function () {
    it('should merge `source` into `object`', function () {
      const names = {
        characters: [{ name: 'barney' }, { name: 'fred' }],
      };

      const ages = {
        characters: [{ age: 36 }, { age: 40 }],
      };

      const expected = {
        characters: [
          { name: 'barney', age: 36 },
          { name: 'fred', age: 40 },
        ],
      };

      expect(mergeDeepCopy(names, ages)).toStrictEqual(expected);
    });

    it('should treat sparse array sources as dense', function () {
      const array = [1];
      array[3] = 3;

      const array2: any = [];
      array2[1] = 5;

      const actual = mergeDeepCopy(array, array2),
        expected: any = array.slice();

      expected[1] = 5;
      expected[2] = undefined;

      expect(actual).toStrictEqual(expected);
    });

    it('should assign `null` values', function () {
      const actual = mergeDeepCopy({ a: 1 }, { a: null });
      expect(actual.a).toBe(null);
    });

    it('should assign non array/buffer/typed-array/plain-object source values directly', function () {
      class Foo {}

      const values = [true, new Date(), Foo, 5, '', new RegExp('')],
        expected = values.map(() => true);

      const actual = values.map(function (value) {
        const object = mergeDeepCopy({}, { a: value, b: { c: value } });
        return object.a === value && object.b.c === value;
      });

      expect(actual).toStrictEqual(expected);
    });

    it('should not augment source objects', function () {
      const source1 = { a: [{ a: 1 }] },
        source2 = { a: [{ b: 2 }] },
        actual = mergeDeepCopy(source1, source2);

      expect(source1.a).toStrictEqual([{ a: 1 }]);
      expect(source2.a).toStrictEqual([{ b: 2 }]);
      expect(actual.a).toStrictEqual([{ a: 1, b: 2 }]);

      const source1b = { a: [[1, 2, 3]] },
        source2b = { a: [[3, 4]] },
        actualb = mergeDeepCopy(source1b, source2b);

      expect(source1b.a).toStrictEqual([[1, 2, 3]]);
      expect(source2b.a).toStrictEqual([[3, 4]]);
      expect(actualb.a).toStrictEqual([[3, 4, 3]]);
    });

    it('should not overwrite existing values with `undefined` values of object sources', function () {
      const actual = mergeDeepCopy({ a: 1 }, { a: undefined, b: undefined });
      expect(actual).toStrictEqual({ a: 1, b: undefined });
    });

    it('should not overwrite existing values with `undefined` values of array sources', function () {
      let array: any[] = [1];
      array[2] = 3;

      let actual = mergeDeepCopy([4, 5, 6], array);
      const expected = [1, 5, 3];

      expect(actual).toStrictEqual(expected);

      // eslint-disable-next-line no-sparse-arrays
      array = [1, , 3];
      array[1] = undefined;

      actual = mergeDeepCopy([4, 5, 6], array);
      expect(actual).toStrictEqual(expected);
    });

    it('should still clone even when overwriting', () => {
      const nested = { fiver: 'fine' };
      const merged = mergeDeepCopy({ a: [1, 2, 3] }, { a: nested });
      expect(merged).toMatchInlineSnapshot(`
        Object {
          "a": Object {
            "fiver": "fine",
          },
        }
      `);
      expect(merged.a).not.toBe(nested);

      const nested2 = [1, 2, 3];
      const merged2 = mergeDeepCopy({ a: { fiver: 'fine' } }, { a: [1, 2, 3] });
      expect(merged2).toMatchInlineSnapshot(`
        Object {
          "a": Array [
            1,
            2,
            3,
          ],
        }
      `);
      expect(merged2.a).not.toBe(nested2);
    });
  });
});

describe('isMergeable()', () => {
  it('should not consider react elements to be mergeable', () => {
    expect(isMergeable(<div />)).toBe(false);
  });
});
