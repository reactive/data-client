import { Entity, resource } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

type CartItemData = {
  id: string;
  product: { id: string; name: string; price: number };
  quantity: number;
};

type CartInterceptorState = {
  items: Record<string, CartItemData>;
};

class Product extends Entity {
  id = '';
  name = '';
  price = 0;
}
class CartItem extends Entity {
  id = '';
  product = Product.fromJS();
  quantity = 1;

  static schema = { product: Product };
}
export const CartResource = resource({
  path: '/cart/items/:id',
  schema: CartItem,
});

// $48: one more filter pack crosses the $50 free shipping line
const initialItems: Record<string, CartItemData> = {
  '1': {
    id: '1',
    product: { id: 'house-blend', name: 'House blend', price: 16 },
    quantity: 2,
  },
  '2': {
    id: '2',
    product: { id: 'mug', name: 'Ceramic mug', price: 12 },
    quantity: 1,
  },
  '3': {
    id: '3',
    product: { id: 'filters', name: 'Paper filters', price: 4 },
    quantity: 1,
  },
};

export const getInitialInterceptorData = (): CartInterceptorState => ({
  items: structuredClone(initialItems),
});

export const cartFixtures: Interceptor<CartInterceptorState>[] = [
  {
    endpoint: CartResource.getList,
    response() {
      return Object.values(this.items);
    },
    delay: 150,
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
  {
    endpoint: CartResource.delete,
    response({ id }: Parameters<typeof CartResource.delete>[0]) {
      delete this.items[id];
      return { id };
    },
    delay: 300,
  },
];
