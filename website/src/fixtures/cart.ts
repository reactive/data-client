import { Entity, resource } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

class Product extends Entity {
  id = '';
  name = '';
  price = 0;
}
const ProductResource = resource({ path: '/products/:id', schema: Product });
class CartItem extends Entity {
  id = '';
  product = Product.fromJS();
  quantity = 1;

  static schema = { product: Product };
}
const CartResource = resource({ path: '/cart/items/:id', schema: CartItem });

const products = {
  'house-blend': { id: 'house-blend', name: 'House blend', price: 16 },
  mug: { id: 'mug', name: 'Ceramic mug', price: 12 },
  filters: { id: 'filters', name: 'Paper filters', price: 4 },
  dripper: { id: 'dripper', name: 'Pour-over dripper', price: 22 },
};

// $48: one more filter pack crosses the $50 free shipping line
const initialItems = {
  'house-blend': {
    id: 'house-blend',
    product: products['house-blend'],
    quantity: 2,
  },
  mug: { id: 'mug', product: products.mug, quantity: 1 },
  filters: { id: 'filters', product: products.filters, quantity: 1 },
};
type CartItemData = (typeof initialItems)[keyof typeof initialItems];
type CartInterceptorState = { items: Record<string, CartItemData> };

export const getInitialInterceptorData = (): CartInterceptorState => ({
  items: structuredClone(initialItems),
});

export const cartFixtures: Interceptor<CartInterceptorState>[] = [
  {
    endpoint: ProductResource.getList,
    response() {
      return Object.values(products);
    },
    delay: 150,
  },
  {
    endpoint: CartResource.getList,
    response() {
      return Object.values(this.items);
    },
    delay: 150,
  },
  {
    endpoint: CartResource.getList.push,
    response(body: Parameters<typeof CartResource.getList.push>[0]) {
      const item = body as CartItemData;
      this.items[item.id] = item;
      return item;
    },
    delay: 300,
  },
  {
    endpoint: CartResource.partialUpdate,
    response(
      { id }: Parameters<typeof CartResource.partialUpdate>[0],
      body: Parameters<typeof CartResource.partialUpdate>[1],
    ) {
      this.items[id] = { ...this.items[id], ...body };
      return this.items[id];
    },
    delay: 300,
  },
];
