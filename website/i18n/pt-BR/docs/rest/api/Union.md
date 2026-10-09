---
title: Union Schema - Dados polimórficos declarativos para React
vue_title: Union Schema - Dados polimórficos declarativos para Vue
sidebar_label: Union
---

import PolymorphicFeedDemo from '../shared/\_PolymorphicFeedDemo.mdx';
import StackBlitz from '@site/src/components/StackBlitz';

# Union

Descreve um schema que é a união de vários schemas. É útil quando você precisa do comportamento polimórfico oferecido por [schema.Array](./Array.md) ou [Values](./Values.md), mas para campos que não são coleções.

- `definition`: **obrigatório** Um objeto que mapeia a definição das entities aninhadas encontradas no array de entrada
- `schemaAttribute`: **obrigatório** O atributo de cada entity encontrada que define qual schema, de acordo com o mapeamento de definição, será usado na normalização.
  Pode ser uma string ou uma função. Se for uma função, recebe os seguintes argumentos:
  - `value`: O valor de entrada da entity.
  - `parent`: O objeto pai do array de entrada.
  - `key`: A chave sob a qual o array de entrada aparece no objeto pai.

#### Métodos de instância {#instance-methods}

- `define(definition)`: Quando usado, o `definition` recebido é mesclado com a definição original passada ao construtor de `Union`. Este método costuma ser útil para criar referências circulares no schema.

:::info[Nomenclatura]

`Union` tem esse nome por causa do [conceito da teoria dos conjuntos](https://en.wikipedia.org/wiki/Union_(set_theory)), assim como as [Unions do TypeScript](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

:::

## Uso {#usage}

:::note

Se os dados retornarem um objeto para o qual você não forneceu um mapeamento, o objeto original será retornado no resultado e nenhuma entity será criada.

:::

<PolymorphicFeedDemo schema="Union" attribute="string" />

### schemaAttribute como função {#function-schemaattribute}

Quando o valor discriminador não corresponde diretamente às chaves do schema, use uma função para calcular qual schema usar.

<PolymorphicFeedDemo schema="Union" attribute="function" />

:::react

### Eventos do Github {#github-events}

A atividade de contribuição vem do agrupamento de eventos do github por tipo. Cada tipo de Event tem seu
próprio schema distinto, e é por isso que usamos `Union`

<StackBlitz app="github-app" file="src/pages/ProfileDetail/UserEvents.tsx,src/resources/Event.tsx" view="preview" initialpath="/users/ntucker" height="700" />

:::
