---
title: Defining your Resource types
sidebar_label: Resource types
id: resource-types
original_id: resource-types
---

Typing your data can be very useful and is highly recommended when using this library.
One of the main benefits is to enforce immutability, as this brings certain assurances
to the correctness of your application as well as enables certain performance enhancements
with React.

Here we have an example [Resource](../api/Resource.md) for a User typed in typescript.

<!--DOCUSAURUS_CODE_TABS-->
<!--TypeScript-->
```typescript
export interface Address {
  readonly street: string;
  readonly suite: string;
  readonly city: string;
  readonly zipcode: string;
  readonly geo: {
    readonly lat: string;
    readonly lng: string;
  };
}

export type Status = 'pending' | 'rejected' | 'accepted';

export class UserResource extends Resource {
  readonly id: number | undefined = undefined;
  readonly name: string = '';
  readonly username: string = '';
  readonly email: string = '';
  readonly phone: string = '';
  readonly website: string = '';
  readonly address: Address | null = null;
  readonly status: Status = 'pending';

  pk() {
    return this.id?.toString();
  }
  static urlRoot = 'https://example.com/users/';
}
```
<!--Javascript-->
```js
export class UserResource extends Resource {
  id = undefined;
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';
  address = null;
  status = 'pending';

  pk() {
    return this.id;
  }
  static urlRoot = 'https://example.com/users/';
}
```
<!--END_DOCUSAURUS_CODE_TABS-->

### Guidelines:

- Define all properties you expect to see
- Mark them as readonly to enforce immutability
- Give each property as specific and descriptive a type as possible
- Initialize the property with a sensible default
  - This will simplify handling so we don't have to deal with `undefined`s
