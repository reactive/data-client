---
title: Union Schema - Datos polimórficos declarativos para React
vue_title: Union Schema - Datos polimórficos declarativos para Vue
sidebar_label: Union
---

import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import StackBlitz from '@site/src/components/StackBlitz';

# Union

Describe un schema que es la unión de varios schemas. Es útil si necesitas el comportamiento polimórfico que ofrecen [schema.Array](./Array.md) o [Values](./Values.md), pero para campos que no son colecciones.

- `definition`: **obligatorio** Un objeto que asigna la definición de las entidades anidadas que se encuentran dentro del array de entrada
- `schemaAttribute`: **obligatorio** El atributo de cada entidad encontrada que define qué schema, según el mapeo de la definición, se usará al normalizar.
  Puede ser un string o una función. Si se da una función, recibe los siguientes argumentos:
  - `value`: El valor de entrada de la entidad.
  - `parent`: El objeto padre del array de entrada.
  - `key`: La clave con la que aparece el array de entrada en el objeto padre.

#### Métodos de instancia {#instance-methods}

- `define(definition)`: Cuando se usa, la `definition` que se pasa se combinará con la definición original pasada al constructor de `Union`. Este método suele ser útil para crear referencias circulares en el schema.

:::info[Nomenclatura]

`Union` recibe su nombre del [concepto de la teoría de conjuntos](https://en.wikipedia.org/wiki/Union_(set_theory)), igual que las [Unions de TypeScript](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

:::

## Uso {#usage}

:::note

Si tus datos devuelven un objeto para el que no proporcionaste un mapeo, el objeto original se devolverá en el resultado y no se creará una entidad.

:::

<PolymorphicFeedDemo schema="Union" attribute="string" />

### Función schemaAttribute {#function-schemaattribute}

Cuando el valor discriminador no coincide directamente con las claves del schema, usa una función para calcular qué schema utilizar.

<PolymorphicFeedDemo schema="Union" attribute="function" />

:::react

### Eventos de Github {#github-events}

La actividad de contribución proviene de agrupar los eventos de github por su tipo. Cada tipo de Event tiene su
propio schema distinto, y por eso usamos `Union`

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserEvents.tsx,src/resources/Event.tsx" view="preview" initialpath="/users/ntucker" height="700" />

:::
