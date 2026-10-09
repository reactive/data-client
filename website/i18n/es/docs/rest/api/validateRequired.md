---
title: validateRequired
---

```ts
function validateRequired(processedEntity: any, requiredDefaults: Record<string, unknown>): string | undefined;
```

Devuelve un mensaje de tipo string si falta alguna de las claves de `requiredDefaults` en `processedEntity`. Esto
puede usarse para [validar](./Entity.md#validate) los campos que deben proporcionarse.

```ts
class CustomBaseEntity extends Entity {
  static validate(processedEntity) {
    return validateRequired(processedEntity, this.defaults) || super.validate(processedEntity);
  }
}
```

## Resultados parciales/completos {#partialfull-results}

Esto puede ser útil para validar automáticamente los [resultados parciales](../guides/partial-entities.md)

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

## Campos opcionales {#optional-fields}

Si tenemos un campo que no siempre estará presente (como `lastRun` aquí), simplemente podemos
'excluirlo' de los campos que requerimos.

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

### Los resultados completos solo tienen campos opcionales {#full-results-only-have-optional-fields}

En caso de que todos los campos del recurso 'completo' fueran opcionales:

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

Este código no sabría que debe obtener el recurso 'completo' si el resumen ya se proporcionó.
No habría forma de saber si los campos simplemente no existen para esos datos o si no se obtuvieron.
En este caso, lo mejor es proporcionar un valor predeterminado `null` para *al menos* un campo.

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

Esto permite que el cliente sepa si el recurso 'completo' se ha obtenido o no.
