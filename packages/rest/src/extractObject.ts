import { Schema } from '@data-client/endpoint';

import { ExtractCollection } from './extractCollection.js';

export type ExtractObject<S extends Record<string, any>> = {
  [K in keyof S]: S[K] extends Schema ? ExtractCollection<S[K]> : never;
}[keyof S];
