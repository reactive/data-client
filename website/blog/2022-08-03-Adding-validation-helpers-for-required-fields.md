---
title: Adding validation helpers for required field checks
authors: [ntucker]
tags: [rest-hooks, validation, data schemas]
---

[validateRequired()](https://resthooks.io/rest/api/validateRequired) will validate that required fields
are present; simplifying some common validation use cases.
[validateRequired()](https://resthooks.io/rest/api/validateRequired) is available in @rest-hooks/@5.1.0 or greater.

```ts
class CustomBaseEntity extends Entity {
  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

<!--truncate-->

### Motivation

Currently the https://resthooks.io/docs/getting-started/validation#partial-results case is a rather cumbersome endeavor; requiring users to maintain custom validation methods for each Resource/Entity they define. Furthermore, in some systems like GraphQL having partial results is quite common.

What makes this more problematic is doing this incorrectly can lead to serious bugs, where data is missing when it is expected. For most cases the default fields provide information about which fields are expected. However, fields can be optional. Unfortunately in these cases, the default value isn't always something that is obvious like `null`. For instance [here, a user had an API that sometimes had a Date field](https://github.com/coinbase/rest-hooks/issues/492). However, the default case the date would be there so it made more sense to have an actual Date default.

While we have made it easier to 'opt-out' of these sorts of validations, it has become clear that doing this out of the box is not intuitive behavior.

### Solution

We can add a simple helper to make defining these easy. Even better - if someone does not have optional fields, the `defaults` static member can be used to add this to a base class. This is great because it still allows opt-out, while having the default behavior more protective. And since the user explicitly added this to the base class the behavior should not be as surprising.

```ts
class CustomBaseEntity extends Entity {
  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

```ts
class FullAnalysis extends SummaryAnalysis {
  readonly graph: number[] = null;
  readonly lastRun?: Date = new Date(0);

  static schema = {
    lastRun: Date,
  }

  static validate(processedEntity) {
    return validateRequired(processedEntity, exclude(this.defaults, ['lastRun']));
  }
}
```
