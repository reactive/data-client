import { normalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import { Values } from '../src';

const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };

class Item extends IDEntity {}
const valuesSchema = new Values(Item);

const normalizedData = normalize(valuesSchema, data);
