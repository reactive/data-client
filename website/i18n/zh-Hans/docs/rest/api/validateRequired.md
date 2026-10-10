---
title: validateRequired
---

```ts
function validateRequired(processedEntity: any, requiredDefaults: Record<string, unknown>): string | undefined;
```

如果 `processedEntity` 中缺少 `requiredDefaults` 的任意键，则返回一条字符串消息。你可以用它来
[校验](./Entity.md#validate)必须提供的字段。

```ts
class CustomBaseEntity extends Entity {
  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

## 部分/完整结果 {#partialfull-results}

这可以用于自动校验[部分结果](../guides/partial-entities.md)

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

## 可选字段 {#optional-fields}

如果某个字段并不总是存在（比如这里的 `lastRun`），我们只需将它从必需字段中
“排除”即可。

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

### 完整结果只有可选字段 {#full-results-only-have-optional-fields}

如果“完整”资源的每个字段都是可选的：

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

如果摘要数据已经存在，这段代码就无法正确判断需要获取“完整”资源。
因为无从得知这些字段是该数据本来就没有，还是尚未被获取。
这种情况下，最好为*至少*一个字段提供 `null` 默认值。

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

这样客户端就能判断“完整”资源究竟是否已被获取。
