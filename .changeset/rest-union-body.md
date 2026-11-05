---
'@data-client/rest': patch
---

Fix calling a [RestEndpoint](https://dataclient.io/rest/api/RestEndpoint) whose `body` type is a union

A `body` typed as a union, like a zod discriminated union or `A & (B | C)`, made the endpoint uncallable: no value of the whole union was accepted, and through `extend({ body })` the body was typed `never`. The endpoint now takes any member of the union. Bodies that may be `undefined` still make the body optional.

```ts
type Register = { email: string } & (
  { teamId: string; teamName: null } | { teamId: null; teamName: string }
);
const register = new RestEndpoint({
  path: '/auth/register',
  method: 'POST',
  body: {} as Register,
});

declare const input: Register;
// Before: TypeScript error, Argument of type '[Register]' is not assignable
// After: compiles
register(input);
```

[push](https://dataclient.io/rest/api/RestEndpoint#push) and [unshift](https://dataclient.io/rest/api/RestEndpoint#unshift) also accept a union `body`, and still resolve a list when sent a list.
