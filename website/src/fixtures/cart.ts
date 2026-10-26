import { Entity, resource } from '@data-client/rest';
import type { Interceptor } from '@data-client/test';

type ProductData = { id: string; name: string; price: number };
type CartItemData = { id: string; product: ProductData; quantity: number };
type CartInterceptorState = { items: Record<string, CartItemData> };

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

const products: ProductData[] = [
  { id: 'house-blend', name: 'House blend', price: 16 },
  { id: 'mug', name: 'Ceramic mug', price: 12 },
  { id: 'filters', name: 'Paper filters', price: 4 },
  { id: 'dripper', name: 'Pour-over dripper', price: 22 },
];

// $48: one more filter pack crosses the $50 free shipping line
const initialQuantities: Record<string, number> = {
  'house-blend': 2,
  mug: 1,
  filters: 1,
};

export const getInitialInterceptorData = (): CartInterceptorState => ({
  items: Object.fromEntries(
    products
      .filter(product => initialQuantities[product.id])
      .map(product => [
        product.id,
        {
          id: product.id,
          product,
          quantity: initialQuantities[product.id],
        },
      ]),
  ),
});

export const cartFixtures: Interceptor<CartInterceptorState>[] = [
  {
    endpoint: ProductResource.getList,
    response() {
      return products;
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
      this.items[id] = { ...this.items[id], ...body } as CartItemData;
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
