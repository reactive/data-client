---
title: Schema Scalar - Campos de entidade dependentes de lens
sidebar_label: Scalar
---

import ScalarDemo from '../shared/\_ScalarDemo.mdx';

# Scalar

`Scalar` descreve campos de [Entity](./Entity.md) cujos valores dependem dos args do endpoint,
como colunas específicas de portfólio, moeda ou locale na mesma linha.

Use `Scalar` quando o campo pertence a uma entidade, mas seu valor muda de acordo com uma
"lens" selecionada pela requisição. Vários componentes podem renderizar a mesma entidade com
args de lens diferentes ao mesmo tempo, cada um recebendo os valores scalar corretos.

- `lens`: **obrigatório** Seleciona o valor da lens a partir dos args do endpoint.
- `key`: **obrigatório** Define o namespace da tabela interna deste scalar.
- `entity`: Vincula o scalar a uma `Entity` quando ele é usado fora de um
  campo de `Entity.schema`.

::::note

`Scalar` é para valores escalares como números, strings, booleanos ou valores derivados de datas.
Use [schemas](./schema.md) aninhados normais para relacionamentos com outras entidades.

::::

## Uso {#usage}

Neste exemplo, `pct_equity` e `shares` dependem do portfólio selecionado, enquanto
`name` e `price` são propriedades estáveis da entidade `Company`.

<ScalarDemo renderCount />

:::react

O badge na pré-visualização conta suas renderizações do React (clique nele para zerar). Trocar para um
novo portfólio renderiza duas vezes, uma pela troca e outra quando suas colunas chegam, enquanto
revisitar um portfólio em cache renderiza uma vez.

:::

Na primeira renderização, `getCompanies` faz fetch uma vez para preencher as entidades Company e
as células iniciais de `Scalar(portfolio)`. Toda troca de portfólio posterior desnormaliza novamente
a partir da entidade `Collection` existente com a nova lens — sem fetch de rede — e
`getPortfolioColumns` busca apenas as células dependentes de lens dos portfólios que o
usuário realmente visita. Revisite um portfólio que já está em cache e nenhum dos endpoints
dispara novamente.

Envolver listas em [Collection](./Collection.md) é o que faz isso funcionar:
`Array` não tem `queryKey`, então `useSuspense(getCompanies, { portfolio: 'B' })`
perderia o cache do endpoint e dispararia um novo fetch. `Collection.queryKey()`
retorna seu pk quando a entidade `Collection` está na store, de modo que o caminho de reutilização
é acionado desde que o pk seja estável entre os casos que você quer compartilhar.

Aqui, [`argsKey: () => ({})`](./Collection.md#argsKey) força todos os portfólios a usarem
o mesmo `pk`, de modo que uma única entidade Collection atende todas as lenses. Quando um endpoint tem
args de filtro reais junto com a lens, mantenha os filtros no pk e descarte apenas
a lens:

```typescript
new Collection([Company], {
  argsKey: ({ portfolio, ...filters }) => filters,
});
```

[`nonFilterArgumentKeys`](./Collection.md#nonFilterArgumentKeys) é uma
questão separada — controla quais args são ignorados quando uma mutação como `push` ou
`assign` corresponde a collections existentes — e _não_ colapsa pks. Use-o para
args de ordenação ou paginação em que os resultados diferem por valor (pks distintos), mas
as criações ainda devem alcançar todas as variantes.

`getPortfolioColumns` também usa `Collection`, mas mantém `portfolio` em seu pk
com `argsKey: ({ portfolio }) => ({ portfolio })`, porque cada portfólio tem uma
resposta de colunas distinta. `Scalar.entityPk()` deriva o id de Company de cada célula
a partir do item do array (delegando para `Company.pk()` por padrão), de modo que o endpoint
pode usar o formato REST natural:

```typescript
[
  { id: '1', pct_equity: 0.5, shares: 10000 },
  { id: '2', pct_equity: 0.2, shares: 4000 },
]
```

### Campos de Entity {#entity-fields}

Use `Scalar` em um campo de `Entity.schema` quando os valores dependentes de lens chegam como parte
da resposta da entidade.

```typescript
import { Collection, Entity, RestEndpoint, Scalar } from '@data-client/rest';

const PortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
});

class Company extends Entity {
  id = '';
  price = 0;
  pct_equity = 0;
  shares = 0;

  static schema = {
    pct_equity: PortfolioScalar,
    shares: PortfolioScalar,
  };
}

const getCompanies = new RestEndpoint({
  path: '/companies',
  searchParams: {} as { portfolio: string },
  schema: new Collection([Company], { argsKey: () => ({}) }),
});
```

Uma única instância de `Scalar` não vinculada pode ser compartilhada entre várias classes de entidade.
Quando usada como campo de `Entity.schema`, a entidade pai é inferida durante a
normalização.

### Endpoint com Values {#values-endpoint}

Use [Values](./Values.md) quando um endpoint retorna apenas as colunas scalar, indexadas pelo
pk da entidade. Como essa resposta não tem um schema de entidade envolvente, passe `entity` ao
construir o `Scalar`.

```typescript
import { Entity, RestEndpoint, Scalar, Values } from '@data-client/rest';

const CompanyPortfolioScalar = new Scalar({
  lens: args => args[0]?.portfolio,
  key: 'portfolio',
  entity: Company,
});

const getPortfolioColumns = new RestEndpoint({
  path: '/companies/columns',
  searchParams: {} as { portfolio: string },
  schema: new Values(CompanyPortfolioScalar),
});

// Response: { '1': { pct_equity: 0.5, shares: 32342 }, '2': { ... } }
```

Endpoints somente de colunas escrevem células `Scalar(portfolio)` sem modificar as
entidades `Company`. Um `Scalar` vinculado ainda pode ser usado como campo de `Entity.schema`;
nesse caso, a entidade pai inferida tem precedência.

## Opções {#options}

```typescript
new Scalar({ lens, key, entity? })
```

### lens(args): string | undefined {#lens}

Seleciona o valor da lens a partir dos args do endpoint, como o ID de um portfólio.

O valor da lens deve estar presente ao normalizar uma resposta. Retornar `undefined`
durante a normalização lança um erro, pois a célula scalar não pode ser armazenada sob uma chave
recuperável. Durante a desnormalização, uma lens ausente retorna `undefined` para aquele campo.

O valor retornado passa a fazer parte da chave da célula armazenada e também é usado na
busca de células durante o [queryKey](#queryKey). Ele deve ser uma string que não
contenha `|` — o caractere `|` é o delimitador do cpk
(`entityKey|entityPk|lens`), e uma lens contendo `|` colidiria com
outras lenses que compartilham o mesmo segmento final.

### key: string {#key}

Nome único para este tipo de scalar. Define o namespace da tabela interna de entidades `Scalar`.

Por exemplo, `key: 'portfolio'` armazena as células em `Scalar(portfolio)`.

### entity?: Entity {#entity}

Classe de entidade para a qual este `Scalar` armazena células.

É opcional quando o scalar é usado como campo em `Entity.schema`, onde a
entidade pai é inferida. É obrigatório no uso independente, como
`new Values(PortfolioScalar)`.

### entityPk(input, parent, key, args): string | number | undefined {#entityPk}

Deriva a chave primária da Entity vinculada quando `Scalar` é usado de forma independente, como
dentro de `Values`, `[Scalar]` ou `Collection([Scalar])`. O pk real da célula
armazenada em `Scalar(key)` é o composto `entityKey|entityPk|lens` — este
método fornece apenas a parte `entityPk`.

Por padrão, `entityPk()`:

- retorna o `key` do mapa envolvente quando ele endereça a
  célula de forma autoritativa — ou seja, `parent[key] === input`, como em `Values(Scalar)`, onde a chave
  do mapa é o pk da entidade e a célula pode não conter os campos do pk — e depois
- delega ao static `Entity.pk(input, parent, key, args)` vinculado, para que as respostas em array de
  `[Scalar]` e `Collection([Scalar])` — incluindo arrays
  aninhados em um schema de objeto pai como `{ stock: [Scalar] }`, e
  pks de Entity personalizados ou compostos — funcionem de imediato.

Sobrescreva `entityPk()` em uma subclasse somente quando a resposta usar um campo de id que
`Entity.pk()` não lê:

```typescript
class CompanyIdScalar extends Scalar {
  entityPk(input: any) {
    return input.companyId;
  }
}
```

## Comportamento {#behavior}

### Normalize {#normalize}

Ao normalizar uma resposta de entidade, `Scalar` armazena o valor do campo em uma
célula separada, indexada por:

```text
entityKey|entityPk|lensValue
```

A linha da entidade mantém uma referência independente de lens para essa célula. Isso permite que uma
linha de entidade aponte para valores scalar diferentes dependendo dos args atuais do endpoint.

Ao normalizar uma resposta `Values`, cada chave de nível superior é tratada como o pk da entidade,
e o valor da resposta é armazenado como a célula scalar dessa entidade para a lens atual.

### Denormalize {#denormalize}

Durante a desnormalização, `Scalar` lê a lens atual a partir dos args do endpoint e procura
a célula correspondente. Se não existir lens ou célula correspondente, o campo é desnormalizado como
`undefined`.

Como a lens participa da memoização da desnormalização, visões separadas de portfólio,
moeda ou locale ficam em cache de forma independente, compartilhando os mesmos dados base
da entidade.

### queryKey {#queryKey}

`Scalar` é um schema [Queryable](/rest/api/schema#queryable). Quando usado como
schema de endpoint de nível superior — ou passado para [useQuery](/docs/api/useQuery),
[Controller.get](/docs/api/Controller#get), [schema.Query](./Query.md) ou qualquer
outro consumidor Queryable — ele informa os cpks de todas as células cuja lens corresponde
aos args atuais:

- Retorna um array de pks compostos em caso de acerto.
- Retorna `undefined` quando a lens é `undefined`, a tabela não existe ou
  nenhuma célula corresponde à lens atual.

O caso comum — `Scalar` aninhado como campo de `Entity.schema` — nunca chega
a este método. A desnormalização passa pela entidade pai, portanto `queryKey`
só é consultado quando `Scalar` é ele mesmo o schema raiz sendo consultado.

### Armazenamento normalizado {#normalized-storage}

```typescript
entities['Company']['1'] = {
  id: '1',
  price: 100,
  pct_equity: ['1', 'pct_equity', 'Company'],
  shares: ['1', 'shares', 'Company'],
}

entities['Scalar(portfolio)']['Company|1|portfolioA'] = {
  pct_equity: 0.5,
  shares: 32342,
}

entities['Scalar(portfolio)']['Company|1|portfolioB'] = {
  pct_equity: 0.3,
  shares: 323,
}
```

## Relacionados {#related}

- [Entity](/rest/api/Entity) — define a entidade base à qual os campos scalar se vinculam
- [Values](./Values.md) — usado para endpoints somente de colunas (dicionário indexado pelo pk da entidade)
- [Union](./Union.md) — padrão de wrapper semelhante para entidades polimórficas
- [Queryable](/rest/api/schema#queryable) — Scalar participa de [useQuery](/docs/api/useQuery), [Controller.get](/docs/api/Controller#get) e [schema.Query](./Query.md)
