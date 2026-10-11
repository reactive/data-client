---
title: "SubscriptionManager"
sidebar_label: SubscriptionManager
---

```typescript
class SubscriptionManager<S extends SubscriptionConstructable> implements Manager
```

Orquesta todas las suscripciones; garantiza datos actualizados sin obtenerlos en exceso.

:::info implements

`SubscriptionManager` implements [Manager](./Manager.md)

:::

## constructor(Subscription: S) {#constructorsubscription-s}

[Subscription](#subscription) es la clase que se usará para manejar las suscripciones a cada endpoint.
Cada instancia representa una suscripción a un endpoint único y específico.

## Acciones consumidas {#consumed-actions}

- 'rdc/subscribe'
- 'rdc/unsubscribe'

## Subscription {#subscription}

`Subscription` es una clase que implementa `SubscriptionConstructable`. Las instancias de `Subscription`
manejan las suscripciones reales.

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

Agrega una nueva suscripción al recurso con la frecuencia indicada.

### remove(frequency?: number): boolean {#removefrequency-number-boolean}

Elimina una suscripción para la frecuencia dada. Devuelve `true` si ya no quedan
más suscripciones. Esto se usa para limpiar las `Subscription`s que no se utilizan.

### cleanup(): void {#cleanup-void}

Se encarga de liberar los recursos pendientes una vez que la Subscription ya no está en uso.

### Implementación incluida {#included-implementation}

* [PollingSubscription](./PollingSubscription)

:::note

Puedes implementar tu propia `Subscription` para manejar websockets
[despachando](./Controller.md#set) acciones `rdc/set` con los datos que reciba para actualizar el store.
Asegúrate de abrir la conexión en el constructor y de cerrarla
en `cleanup()`

:::
