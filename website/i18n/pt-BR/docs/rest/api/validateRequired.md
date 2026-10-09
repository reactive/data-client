---
title: validateRequired
---

```ts
function validateRequired(processedEntity: any, requiredDefaults: Record<string, unknown>): string | undefined;
```

Retorna uma mensagem em string se alguma das chaves de `requiredDefaults` estiver ausente em `processedEntity`. Isso
pode ser usado para [validar](./Entity.md#validate) campos que precisam ser fornecidos.

```ts
class CustomBaseEntity extends Entity {
  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

## Resultados parciais/completos {#partialfull-results}

Isso pode ser útil para validar automaticamente [resultados parciais](../guides/partial-entities.md)

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

## Campos opcionais {#optional-fields}

Caso haja um campo que nem sempre estará presente (como `lastRun` aqui), basta
'excluí-lo' dos campos que exigimos.

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

### Resultados completos com apenas campos opcionais {#full-results-only-have-optional-fields}

Caso todos os campos do resource 'completo' fossem opcionais:

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

Este código não saberia buscar o resource 'completo' se o resumo já tivesse sido fornecido.
Não haveria como saber se os campos simplesmente não existem para aquele dado ou se não foram buscados.
Nesse caso, o melhor é fornecer um valor padrão `null` para *pelo menos* um campo.

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

Isso permite que o cliente entenda se o resource 'completo' chegou a ser buscado.
