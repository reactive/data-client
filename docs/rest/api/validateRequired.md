---
title: validateRequired
---

```ts
function validateRequired(processedEntity: any, requiredDefaults: Record<string, unknown>): string | undefined;
```

Returns a string message if any keys of `requiredDefaults` are missing in `processedEntity`. This
can be used to [validate](./Entity.md#validate) fields that must be provided.

```ts
class CustomBaseEntity extends Entity {
  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

## Partial/full results

This can be useful to automatically validate for [partial results](../guides/partial-entities.md)

```ts
class SummaryAnalysis extends Entity {
  readonly id: string = '';
  readonly createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  readonly meanValue: number = 0;
  readonly title: string = '';
}

class FullAnalysis extends SummaryAnalysis {
  readonly graph: number[] = [];

  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

## Optional fields

In case we have a field that won't always be present (like `lastRun` here), we can simply
'exclude' it from the fields we require.

```ts
class FullAnalysis extends SummaryAnalysis {
  readonly graph: number[] = [];
  readonly lastRun? = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    lastRun: Temporal.Instant.from,
  }

  static validate(processedEntity) {
    return validateRequired(processedEntity, exclude(this.defaults, ['lastRun']));
  }
}
```

<details collapsed>
<summary><b>exclude()</b></summary>

```ts title="exclude"
function exclude<O extends Record<string, unknown>>(
  obj: O,
  keys: string[],
): Partial<O> {
  const r: any = {};
  Object.keys(obj).forEach(k => {
    if (!keys.includes(k)) r[k] = obj[k];
  });
  return r;
}
```

</details>

### Full results only have optional fields

In case every field of the 'full' resource was optional:

```ts
class FullAnalysis extends SummaryAnalysis {
  readonly graph?: number[] = [];
  readonly lastRun? = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    lastRun: Temporal.Instant.from,
  }

  static validate(processedEntity) {
    return validateRequired(processedEntity, exclude(this.defaults, ['graph', 'lastRun']));
  }
}
```

This code would not successfully know to fetch the 'full' resource if the summary is already provided.
There would be no way of knowing whether the fields simply don't exist for that data, or were not fetched.
In this case, it is best to provide a `null` default for *at least* one field.

```ts
class FullAnalysis extends SummaryAnalysis {
  readonly graph: number[] = null;
  readonly lastRun? = Temporal.Instant.fromEpochMilliseconds(0);

  static schema = {
    lastRun: Temporal.Instant.from,
  }

  static validate(processedEntity) {
    return validateRequired(processedEntity, exclude(this.defaults, ['lastRun']));
  }
}
```

This enables the client to understand whether the 'full' resource has been fetched at all.
