import { normalize, schema } from '../src';
import IDEntity from '../src/entities/IDEntity';

const data = { firstThing: { id: 1 }, secondThing: { id: 2 } };

class Item extends IDEntity {}
const valuesSchema = new schema.Values(Item.asSchema());

const normalizedData = normalize(data, valuesSchema);
