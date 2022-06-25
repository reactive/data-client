---
title: SimpleRecord
---
import LanguageTabs from '@site/src/components/LanguageTabs';

:::caution Deprecated

Use [schema.Object](./Object) instead.

:::

`SimpleRecord` provides a simple immutable interface to store values that have
defaults. When constructed it distinguishes between actually set values and ones
only provided by defaults. This is useful to produce accurate merging algorithms
when dealing with partial data definitions.

<LanguageTabs>

```typescript
import { SimpleRecord } from '@rest-hooks/legacy';

export default class Article extends SimpleRecord {
  readonly id: number | undefined = undefined;
  readonly title: string = '';
  readonly content: string = '';
  readonly author: number | null = null;
  readonly tags: string[] = [];
}
```

```js
import { SimpleRecord } from '@rest-hooks/legacy';

export default class Article extends SimpleRecord {
  id = undefined;
  title = '';
  content = '';
  author = null;
  tags = [];
}
```

</LanguageTabs>

## Factory method

### static fromJS<T extends typeof SimpleRecord\>(this: T, props: Partial<AbstractInstanceType<T\>\>): AbstractInstanceType<T\>

This is used to create instances of the `Resource` you defined. Will copy over props provided to
the instance in construction, among other things. _Be sure to always call `super.fromJS()` when
overriding._

```typescript
const articleA = Article.fromJS({
  title: 'The best library',
  tags: ['Immutable'],
});
const articleB = Article.fromJS({
  content: 'A long droning paragraph',
  tags: ['React', 'TypeScript'],
});
```

## Data methods

### static merge<T extends typeof SimpleRecord\>(first: InstanceType<T\>, second: InstanceType<T\>) => InstanceType<T\>

Takes only the defined (non-default) values of first and second and creates a new instance copying them over.
Second will override values of first. Merge is shallow, so you'll need to override this to do any deep merges.

```typescript
const mergedArticle = Article.merge(articleA, articleB);
console.log(mergedArticle);
/*
{
  id: undefined,
  title: 'The best library',
  content: 'A long droning paragraph',
  author: null,
  tags: ['React', 'TypeScript'],
}
*/
```

### static hasDefined<T extends typeof SimpleRecord\>(instance: InstanceType<T\>, key: keyof InstanceType<T\>) => boolean

Returns whether provided `key` is defined (non-default) in `instance`.

```typescript
console.log(articleA.hasDefined('title'));
/* true */
console.log(articleA.hasDefined('content'));
/* false */
```


### static toObjectDefined<T extends typeof SimpleRecord\>(instance: AbstractInstanceType<T\>) => Partial<InstanceType<T\>\>

Returns an `Object` with only the defined (non-default) members of `instance`.

```typescript
console.log(mergedArticle.toObjectDefined());
/*
{
  title: 'The best library',
  content: 'A long droning paragraph',
  tags: ['React', 'TypeScript'],
}
*/
```

### static keysDefined<T extends typeof SimpleRecord\>(instance: InstanceType<T\>) => (keyof InstanceType<T\>)[]

Returns an `Array` of all defined (non-default) keys of `instance`.

```typescript
console.log(mergedArticle.keysDefined());
/* ['title', 'content', 'tags'] */
```

### static schema: { [k: keyof this]: Schema }

Set this to [define entities nested](/rest/guides/nested-response) inside this one.

Additionally can be used to [declare field deserialization](/rest/guides/network-transform#deserializing-fields)

#### Optional members

Entities references here whose default values in the Record definition itself are
considered 'optional'

```typescript
class UserResponse extends SimpleRecord {
  readonly data: User | null = null; // this field is optional
  readonly lastUpdated: Date = new Date(0);

  static schema = {
    data: User,
    lastUpdated: Date,
  }
}
```
