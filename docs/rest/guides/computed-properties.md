---
title: Computed Properties
---

import FrameworkPlayground from '@site/src/components/FrameworkPlayground';
import {
  cartFixtures,
  getInitialInterceptorData,
} from '@site/src/fixtures/cart';

export const cartDemo = [
  // $48 to $52: the bar fills, and shipping turns free
  { delay: 1200, click: 'button[aria-label="Add one Paper filters"]' },
  { wait: 1800 },
  { click: 'button[aria-label="Add Pour-over dripper"]' },
  { wait: 1800 },
  // the cart's totals are already there
  { click: 'nav a[href="/cart"]' },
  { wait: 2500 },
  { click: 'button[aria-label="Remove one Pour-over dripper"]' },
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

In this store, `getCartTotals` joins each `CartItem`'s quantity with its `Product`'s price. Four
components on two pages read it: the header's cart badge, the free-shipping bar on both pages,
and the cart's order summary and checkout button. Add something in the shop, and every one of
them moves at once.

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
export const ProductResource = resource({
  path: '/products/:id',
  schema: Product,
});

/** A line in the cart, keyed by its product's id */
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

```ts title="getCartTotals" {6-18}
import { All, Query } from '@data-client/rest';
import { CartItem } from './resources/Cart';

export const freeShippingAt = 50;

export const getCartTotals = new Query(new All(CartItem), items => {
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const toFreeShipping = Math.max(0, freeShippingAt - subtotal);
  const shipping = subtotal && toFreeShipping ? 5 : 0;
  return {
    count,
    subtotal,
    shipping,
    total: subtotal + shipping,
    toFreeShipping,
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
    <Link to="/cart" className="meta">
      {totals.count} {totals.count === 1 ? 'item' : 'items'} ·{' '}
      <NumberFlow value={totals.subtotal} format={usd} />
    </Link>
  );
}
```

```tsx title="FreeShipping" collapsed
import { useQuery } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { freeShippingAt, getCartTotals } from './getCartTotals';
import { usd } from './resources/Cart';

export default function FreeShipping() {
  const totals = useQuery(getCartTotals);
  if (!totals) return null;
  return (
    <p className="meta">
      {totals.toFreeShipping > 0 ?
        <>
          Add <NumberFlow value={totals.toFreeShipping} format={usd} /> more
          for free shipping
        </>
      : 'Your order ships free'}
      <progress value={totals.subtotal} max={freeShippingAt} />
    </p>
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
  );
}
```

```tsx title="CheckoutButton" collapsed
import { useQuery } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import { getCartTotals } from './getCartTotals';
import { usd } from './resources/Cart';

export default function CheckoutButton() {
  const totals = useQuery(getCartTotals);
  if (!totals) return null;
  return (
    <button className="primary">
      Check out · <NumberFlow value={totals.total} format={usd} />
    </button>
  );
}
```

```tsx title="QuantityStepper" collapsed
import { useController, useQuery } from '@data-client/react';
import { CartItem, CartResource, Product } from './resources/Cart';

export default function QuantityStepper({ product }: { product: Product }) {
  const ctrl = useController();
  const item = useQuery(CartItem, { id: product.id });
  const add = () =>
    ctrl.fetch(CartResource.getList.push, {
      id: product.id,
      product,
      quantity: 1,
    });
  const setQuantity = (quantity: number) =>
    quantity ?
      ctrl.fetch(CartResource.partialUpdate, { id: product.id }, { quantity })
    : ctrl.fetch(CartResource.delete, { id: product.id });

  return (
    <span className="stepper">
      {item ?
        <>
          <button
            aria-label={`Remove one ${product.name}`}
            onClick={() => setQuantity(item.quantity - 1)}
          >
            −
          </button>
          <output>{item.quantity}</output>
          <button
            aria-label={`Add one ${product.name}`}
            onClick={() => setQuantity(item.quantity + 1)}
          >
            +
          </button>
        </>
      : <button aria-label={`Add ${product.name}`} onClick={add}>
          Add
        </button>
      }
    </span>
  );
}
```

```tsx title="ShopPage" route="/"
import { useSuspense } from '@data-client/react';
import FreeShipping from './FreeShipping';
import QuantityStepper from './QuantityStepper';
import { CartResource, ProductResource, usd } from './resources/Cart';

export default function ShopPage() {
  const products = useSuspense(ProductResource.getList);
  useSuspense(CartResource.getList);
  return (
    <>
      <FreeShipping />
      <div className="list">
        {products.map(product => (
          <div className="listItem" key={product.id}>
            <div>
              {product.name}
              <div className="meta">
                {product.price.toLocaleString('en-US', usd)}
              </div>
            </div>
            <QuantityStepper product={product} />
          </div>
        ))}
      </div>
    </>
  );
}
```

```tsx title="CartPage" route="/cart" collapsed
import { useSuspense } from '@data-client/react';
import NumberFlow from '@number-flow/react';
import CheckoutButton from './CheckoutButton';
import FreeShipping from './FreeShipping';
import OrderSummary from './OrderSummary';
import QuantityStepper from './QuantityStepper';
import { CartResource, usd } from './resources/Cart';

export default function CartPage() {
  const items = useSuspense(CartResource.getList);
  if (!items.length) return <p className="meta">Your cart is empty</p>;
  return (
    <>
      <div className="list">
        {items.map(item => (
          <div className="listItem" key={item.id}>
            <div>{item.product.name}</div>
            <QuantityStepper product={item.product} />
            <span className="meta">
              <NumberFlow value={item.total} format={usd} />
            </span>
          </div>
        ))}
      </div>
      <FreeShipping />
      <OrderSummary />
      <CheckoutButton />
    </>
  );
}
```

```tsx title="Store" layout collapsed
import { useFetch } from '@data-client/react';
import CartBadge from './CartBadge';
import { CartResource } from './resources/Cart';

export default function Store({ children }: { children: React.ReactNode }) {
  // every page shows the cart's totals, so the cart loads with the app
  useFetch(CartResource.getList);
  return (
    <>
      <header className="appHeader">
        <h1 className="appTitle">Daily Grind</h1>
        <CartBadge />
      </header>
      <nav>
        <Link to="/">Shop</Link>
        <Link to="/cart">Cart</Link>
      </nav>
      {children}
    </>
  );
}
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
  <RouterLink v-if="totals" to="/cart" class="meta">
    {{ totals.count }} {{ totals.count === 1 ? 'item' : 'items' }} ·
    <NumberFlow :value="totals.subtotal" :format="usd" />
  </RouterLink>
</template>
```

```html title="FreeShipping.vue" collapsed
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { freeShippingAt, getCartTotals } from './getCartTotals';
  import { usd } from './resources/Cart';

  const totals = useQuery(getCartTotals);
</script>

<template>
  <p v-if="totals" class="meta">
    <template v-if="totals.toFreeShipping > 0">
      Add <NumberFlow :value="totals.toFreeShipping" :format="usd" /> more
      for free shipping
    </template>
    <template v-else>Your order ships free</template>
    <progress :value="totals.subtotal" :max="freeShippingAt" />
  </p>
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
  <dl v-if="totals" class="stats">
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
```

```html title="CheckoutButton.vue" collapsed
<script setup lang="ts">
  import { useQuery } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import { getCartTotals } from './getCartTotals';
  import { usd } from './resources/Cart';

  const totals = useQuery(getCartTotals);
</script>

<template>
  <button v-if="totals" class="primary">
    Check out · <NumberFlow :value="totals.total" :format="usd" />
  </button>
</template>
```

```html title="QuantityStepper.vue" collapsed
<script setup lang="ts">
  import { useController, useQuery } from '@data-client/vue';
  import { CartItem, CartResource, Product } from './resources/Cart';

  const props = defineProps<{ product: Product }>();
  const ctrl = useController();
  const item = useQuery(CartItem, () => ({ id: props.product.id }));
  const add = () =>
    ctrl.fetch(CartResource.getList.push, {
      id: props.product.id,
      product: props.product,
      quantity: 1,
    });
  const setQuantity = (quantity: number) =>
    quantity ?
      ctrl.fetch(
        CartResource.partialUpdate,
        { id: props.product.id },
        { quantity },
      )
    : ctrl.fetch(CartResource.delete, { id: props.product.id });
</script>

<template>
  <span class="stepper">
    <template v-if="item">
      <button
        :aria-label="`Remove one ${product.name}`"
        @click="setQuantity(item.quantity - 1)"
      >
        −
      </button>
      <output>{{ item.quantity }}</output>
      <button
        :aria-label="`Add one ${product.name}`"
        @click="setQuantity(item.quantity + 1)"
      >
        +
      </button>
    </template>
    <button v-else :aria-label="`Add ${product.name}`" @click="add">
      Add
    </button>
  </span>
</template>
```

```html title="ShopPage.vue" route="/"
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import FreeShipping from './FreeShipping.vue';
  import QuantityStepper from './QuantityStepper.vue';
  import { CartResource, ProductResource, usd } from './resources/Cart';

  const products = await useSuspense(ProductResource.getList);
  await useSuspense(CartResource.getList);
</script>

<template>
  <FreeShipping />
  <div class="list">
    <div v-for="product in products" :key="product.id" class="listItem">
      <div>
        {{ product.name }}
        <div class="meta">{{ product.price.toLocaleString('en-US', usd) }}</div>
      </div>
      <QuantityStepper :product="product" />
    </div>
  </div>
</template>
```

```html title="CartPage.vue" route="/cart" collapsed
<script setup lang="ts">
  import { useSuspense } from '@data-client/vue';
  import NumberFlow from '@number-flow/vue';
  import CheckoutButton from './CheckoutButton.vue';
  import FreeShipping from './FreeShipping.vue';
  import OrderSummary from './OrderSummary.vue';
  import QuantityStepper from './QuantityStepper.vue';
  import { CartResource, usd } from './resources/Cart';

  const items = await useSuspense(CartResource.getList);
</script>

<template>
  <p v-if="!items.length" class="meta">Your cart is empty</p>
  <template v-else>
    <div class="list">
      <div v-for="item in items" :key="item.id" class="listItem">
        <div>{{ item.product.name }}</div>
        <QuantityStepper :product="item.product" />
        <span class="meta">
          <NumberFlow :value="item.total" :format="usd" />
        </span>
      </div>
    </div>
    <FreeShipping />
    <OrderSummary />
    <CheckoutButton />
  </template>
</template>
```

```html title="Store.vue" layout collapsed
<script setup lang="ts">
  import { useFetch } from '@data-client/vue';
  import CartBadge from './CartBadge.vue';
  import { CartResource } from './resources/Cart';

  // every page shows the cart's totals, so the cart loads with the app
  useFetch(CartResource.getList);
</script>

<template>
  <header class="appHeader">
    <h1 class="appTitle">Daily Grind</h1>
    <CartBadge />
  </header>
  <nav>
    <RouterLink to="/">Shop</RouterLink>
    <RouterLink to="/cart">Cart</RouterLink>
  </nav>
  <RouterView v-slot="{ Component }">
    <Suspense timeout="0">
      <component :is="Component" />
      <template #fallback><Loading /></template>
    </Suspense>
  </RouterView>
</template>
```

:::

</FrameworkPlayground>

Computing these totals in each component instead would repeat the math in all four, each
fetching or being passed both kinds of data, and free to drift (one rounds, one forgets the
shipping rule). With a `Query`:

- **One definition, read anywhere.** The badge, the bar, the summary and the checkout button
  never pass totals to each other, and they can't disagree. A fifth place that needs the total
  is one `useQuery()` call.
- **Computed once per change.** `useQuery()` results are memoized globally against the entities
  they read. However many components read `getCartTotals`, it runs once when a `CartItem` or
  `Product` changes, and otherwise returns the same object.
- **Always current.** Any change to the cart, from any page, like this demo's
  [optimistic](../api/resource.md#optimistic) updates, re-derives every total at once, with
  nothing to invalidate or sync.
