---
title: "SubscriptionManager"
sidebar_label: SubscriptionManager
---

```typescript
class SubscriptionManager<S extends SubscriptionConstructable> implements Manager
```

Orquestra todas as subscriptions, garantindo dados atualizados sem buscas excessivas.

:::info implements

`SubscriptionManager` implementa [Manager](./Manager.md)

:::

## constructor(Subscription: S) {#constructorsubscription-s}

[Subscription](#subscription) é a classe usada para gerenciar as subscriptions de cada endpoint.
Cada instância representa uma subscription a um endpoint único específico.

## Actions consumidas {#consumed-actions}

- 'rdc/subscribe'
- 'rdc/unsubscribe'

## Subscription {#subscription}

`Subscription` é uma classe que implementa `SubscriptionConstructable`. As instâncias de `Subscription`
gerenciam as subscriptions de fato.

```typescript
/** Interface handling a single resource subscription */
interface Subscription {
  add(frequency?: number): void;
  remove(frequency?: number): boolean;
  cleanup(): void;
}

/** The static class that constructs Subscription */
export interface SubscriptionConstructable {
  new (
    action: Omit<SubscribeAction, 'type'>,
    controller: Controller,
  ): Subscription;
}
```

### add(frequency?: number): void {#addfrequency-number-void}

Adiciona uma nova subscription ao recurso na frequência informada.

### remove(frequency?: number): boolean {#removefrequency-number-boolean}

Remove uma subscription para a frequência informada. Retorna `true` se não restarem
mais subscriptions depois disso. Isso é usado para limpar `Subscription`s sem uso.

### cleanup(): void {#cleanup-void}

Realiza a limpeza de quaisquer recursos pendentes depois que a Subscription deixa de ser usada.

### Implementação incluída {#included-implementation}

* [PollingSubscription](./PollingSubscription)

:::note

Você pode implementar sua própria `Subscription` para lidar com websockets
[despachando](./Controller.md#set) actions `rdc/set` com os dados que ela recebe para atualizar.
Certifique-se de abrir a conexão no constructor e fechá-la
em `cleanup()`

:::
