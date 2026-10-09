---
title: '⚛ Atomic Mutations: Mutações assíncronas seguras e de alto desempenho'
sidebar_label: Atomic Mutations
---

<head>
  <meta name="docsearch:pagerank" content="10"/>
</head>

# Segurança além dos tipos

Quando um usuário causa mutações como criar, atualizar ou excluir recursos, é importante
que essas mudanças sejam refletidas na aplicação. Um cache simples de publicação
que não tem nenhum conhecimento das estruturas de dados exigiria refazer o fetch de qualquer endpoint
que fosse alterado. Isso reduziria o desempenho e colocaria uma carga extra no backend.

No entanto, como em muitos outros casos, um cache normalizado - que conhece as relações
entre os recursos - é capaz de manter todos os dados consistentes e atualizados sem
nenhum novo fetch.

## Update {#update}

O Reactive Data Client usa as definições de schema para entender como normalizar os dados de resposta em
uma `entity table` e uma `result table`. Isso significa, é claro, que existe sempre apenas uma cópia
de determinada `entity`. Além de oferecer consistência ao usar diferentes endpoints de resposta,
isso significa que, ao fornecer uma definição de schema precisa, o Reactive Data Client pode manter automaticamente
todos os usos dos dados consistentes e atualizados. Os endpoints de atualização padrão [Resource.update](/rest/api/resource#update) e
[Resource.partialUpdate](/rest/api/resource#partialupdate) fazem isso automaticamente. [Leia mais sobre como definir outros
endpoints de atualização](/rest/guides/side-effects)

## Delete {#delete}

O Reactive Data Client exclui automaticamente as entradas de entity quando [schema.Invalidate](/rest/api/Invalidate) é usado.
[Resource.delete](/rest/api/resource#delete)
fornece um endpoint assim.

## Create {#create}

As entities criadas ficam disponíveis imediatamente. Elas também podem ser adicionadas a [Collections](/rest/api/Collection) existentes
com [.push](/rest/api/RestEndpoint#push), [.unshift](/rest/api/RestEndpoint#unshift) ou [.assign](/rest/api/RestEndpoint#assign).
