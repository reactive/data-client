import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { schema } from '../src';

const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };

class Item extends IDEntity {}
const valuesSchema = new schema.Values(Item);

const normalizedData = normalize(valuesSchema, data);
