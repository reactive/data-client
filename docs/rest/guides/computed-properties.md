---
title: Computed Properties
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {
  cartFixtures,
  getInitialInterceptorData,
} from '@site/src/fixtures/cart';

export const cartDemo = [
  // $48 to $52: free shipping, and the total drops
  { delay: 1200, click: 'button[aria-label="Add one Paper filters"]' },
  { wait: 2200 },
  { click: 'button[aria-label="Remove one House blend"]' },
  { wait: 2200 },
  { click: 'button[aria-label="Add one House blend"]' },
];

## Singular computations

[Entity](../api/Entity.md) classes are just normal classes, so any common derived data can just be added as
getters to the class itself.

```typescript
import { All, Entity, Query } from '@data-client/rest';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  username = '';
  email = '';

  // highlight-start
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }
  // highlight-end

  static key = 'User';
}
```

If the computations are expensive feel free to add some
[memoization](https://github.com/anywhichway/nano-memoize).

```typescript
import { All, Entity, Query } from '@data-client/rest';
import memoize from 'nano-memoize';

class User extends Entity {
  truelyExpensiveValue = memoize(() => {
    // compute that expensive thing!
  });
}
```

:::tip

If you simply want to [deserialize a field](./network-transform.md#deserializing-fields) to a more useful form like [Temporal.Instant](https://tc39.es/proposal-temporal/docs/instant.html) or [BigNumber](https://github.com/MikeMcl/bignumber.js), you can use
the declarative [static schema](./network-transform.md#deserializing-fields).

```typescript
import { All, Entity, Query } from '@data-client/rest';
import BigNumber from 'bignumber.js';

class User extends Entity {
  id = '';
  firstName = '';
  lastName = '';
  createdAt = Temporal.Instant.fromEpochMilliseconds(0);
  lifetimeBlinkCount = BigNumber(0);

  static key = 'User';

  // highlight-start
  static schema = {
    createdAt: Temporal.Instant.from,
    lifetimeBlinkCount: BigNumber,
  };
  // highlight-end
}
```

:::

## Global computations

[Query](../api/Query.md) derives data from many entities at once, such as a count or a total
(an aggregate). Define it once, beside your resources, and read it from any component with
[useQuery](/docs/api/useQuery).

Here a cart's totals join each `CartItem`'s quantity with its `Product`'s price, and charge
shipping under $50. The header's `CartBadge` and the `OrderSummary` under the items both read
`getCartTotals`; change a quantity and both follow.

<FrameworkPlayground
demo
fixtures={cartFixtures}
getInitialInterceptorData={getInitialInterceptorData}
defaultTab="getCartTotals"
autoRun={cartDemo}
>

```ts title="resources/Cart" collapsed
import { Entity, resource } from '@data-client/rest';

export class Product extends Entity {
  id = '';
  name = '';
  price = 0;
}

export class CartItem extends Entity {
  id = '';
  product = Product.fromJS();
  quantity = 1;

  get total() {
    return this.quantity * this.product.price;
  }

  static schema = { product: Product };
}

export const CartResource = resource({
  path: '/cart/items/:id',
  schema: CartItem,
  optimistic: true,
});

export const usd = { style: 'currency', currency: 'USD' } as const;
```

```ts title="getCartTotals" {4-17}
import { All, Query } from '@data-client/rest';
import { CartItem } from './resources/Cart';

export const getCartTotals = new Query(new All(CartItem), items => {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const freeShippingAt = 50;
  const shipping = subtotal === 0 || subtotal >= freeShippingAt ? 0 : 5;
  return {
    count,
    subtotal,
    shipping,
    total: subtotal + shipping,
    toFreeShipping: Math.max(0, freeShippingAt - subtotal),
  };
});
```

:::react

```tsx title="CartBadge" collapsed
import { useQuery } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getCartTotals } from './getCartTotals';
import { usd } from './resources/Cart';

export default function CartBadge() {
  const totals = useQuery(getCartTotals);
  if (!totals) return null;
  return (
    <span className="meta">
      {totals.count} {totals.count === 1 ? 'item' : 'items'} ·{' '}
      <NumberFlow value={totals.subtotal} format={usd} />
    </span>
  );
}
```

```tsx title="OrderSummary" collapsed
import { useQuery } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getCartTotals } from './getCartTotals';
import { usd } from './resources/Cart';

export default function OrderSummary() {
  const totals = useQuery(getCartTotals);
  if (!totals) return null;
  return (
    <>
      <p className="meta">
        {totals.toFreeShipping > 0 ?
          <>
            Add <NumberFlow value={totals.toFreeShipping} format={usd} /> more
            for free shipping
          </>
        : 'Your order ships free'}
      </p>
      <dl className="stats">
        <div>
          <dt>Subtotal</dt>
          <dd><NumberFlow value={totals.subtotal} format={usd} /></dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>
            {totals.shipping ?
              <NumberFlow value={totals.shipping} format={usd} />
            : 'Free'}
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd><NumberFlow value={totals.total} format={usd} /></dd>
        </div>
      </dl>
    </>
  );
}
```

```tsx title="CartPage" collapsed
import { useController, useSuspense } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import CartBadge from './CartBadge';
import OrderSummary from './OrderSummary';
import { CartItem, CartResource, usd } from './resources/Cart';

function CartPage() {
  const items = useSuspense(CartResource.getList);
  const ctrl = useController();
  const setQuantity = (item: CartItem, quantity: number) =>
    quantity ?
      ctrl.fetch(CartResource.partialUpdate, { id: item.id }, { quantity })
    : ctrl.fetch(CartResource.delete, { id: item.id });

  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Daily Grind</h1>
        <CartBadge />
      </header>
      <h2>Cart</h2>
      <div className="list">
        {items.map(item => (
          <div className="listItem" key={item.id}>
            <div>
              {item.product.name}
              <div className="meta">
                <NumberFlow value={item.product.price} format={usd} />
              </div>
            </div>
            <span className="stepper">
              <button
                aria-label={`Remove one ${item.product.name}`}
                onClick={() => setQuantity(item, item.quantity - 1)}
              >
                −
              </button>
              <output>{item.quantity}</output>
              <button
                aria-label={`Add one ${item.product.name}`}
                onClick={() => setQuantity(item, item.quantity + 1)}
              >
                +
              </button>
            </span>
            <span className="meta">
              <NumberFlow value={item.total} format={usd} />
            </span>
          </div>
        ))}
      </div>
      <OrderSummary />
    </>
  );
}
render(<CartPage />);
```

:::

:::vue

```html title="CartBadge.vue" collapsed
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getCartTotals } from './getCartTotals';
  import { usd } from './resources/Cart';

  const totals = useQuery(getCartTotals);
</script>

<template>
  <span v-if="totals" class="meta">
    {{ totals.count }} {{ totals.count === 1 ? 'item' : 'items' }} ·
    <NumberFlow :value="totals.subtotal" :format="usd" />
  </span>
</template>
```

```html title="OrderSummary.vue" collapsed
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getCartTotals } from './getCartTotals';
  import { usd } from './resources/Cart';

  const totals = useQuery(getCartTotals);
</script>

<template>
  <template v-if="totals">
    <p class="meta">
      <template v-if="totals.toFreeShipping > 0">
        Add <NumberFlow :value="totals.toFreeShipping" :format="usd" /> more
        for free shipping
      </template>
      <template v-else>Your order ships free</template>
    </p>
    <dl class="stats">
      <div>
        <dt>Subtotal</dt>
        <dd><NumberFlow :value="totals.subtotal" :format="usd" /></dd>
      </div>
      <div>
        <dt>Shipping</dt>
        <dd>
          <NumberFlow
            v-if="totals.shipping"
            :value="totals.shipping"
            :format="usd"
          />
          <template v-else>Free</template>
        </dd>
      </div>
      <div>
        <dt>Total</dt>
        <dd><NumberFlow :value="totals.total" :format="usd" /></dd>
      </div>
    </dl>
  </template>
</template>
```

```html title="CartPage.vue" collapsed
<script setup lang="ts">
  import { useController, useSuspense } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import CartBadge from './CartBadge.vue';
  import OrderSummary from './OrderSummary.vue';
  import { CartItem, CartResource, usd } from './resources/Cart';

  const items = await useSuspense(CartResource.getList);
  const ctrl = useController();
  const setQuantity = (item: CartItem, quantity: number) =>
    quantity ?
      ctrl.fetch(CartResource.partialUpdate, { id: item.id }, { quantity })
    : ctrl.fetch(CartResource.delete, { id: item.id });
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Daily Grind</h1>
    <CartBadge />
  </header>
  <h2>Cart</h2>
  <div class="list">
    <div v-for="item in items" :key="item.id" class="listItem">
      <div>
        {{ item.product.name }}
        <div class="meta">
          <NumberFlow :value="item.product.price" :format="usd" />
        </div>
      </div>
      <span class="stepper">
        <button
          :aria-label="`Remove one ${item.product.name}`"
          @click="setQuantity(item, item.quantity - 1)"
        >
          −
        </button>
        <output>{{ item.quantity }}</output>
        <button
          :aria-label="`Add one ${item.product.name}`"
          @click="setQuantity(item, item.quantity + 1)"
        >
          +
        </button>
      </span>
      <span class="meta">
        <NumberFlow :value="item.total" :format="usd" />
      </span>
    </div>
  </div>
  <OrderSummary />
</template>
```

:::

</FrameworkPlayground>

Computing these totals in a component instead would mean fetching both kinds of data
there, repeating the math wherever totals show, or passing them down as props. With a
`Query`:

- **One definition, read anywhere.** `CartBadge` and `OrderSummary` never pass totals to each
  other, so they can't disagree. Showing the total somewhere new, like a checkout button, is one
  `useQuery()` call.
- **Computed once per change.** `useQuery()` results are memoized globally against the entities
  they read. However many components read `getCartTotals`, it runs once when a `CartItem` or
  `Product` changes, and otherwise returns the same object.
- **Always current.** Any change to an item, like this demo's [optimistic](../api/resource.md#optimistic)
  quantity updates, re-derives every total at once, with nothing to invalidate or sync.
