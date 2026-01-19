import { normalize, denormalize } from '@data-client/normalizr';
import { IDEntity } from '__tests__/new';

import {
  Union,
  Values,
  DenormalizeNullable,
  Normalize,
  Denormalize,
} from '../src';

class Magic extends IDEntity {
  readonly a = 'first' as const;
  private b = false;
  c = 'arg' as const;
}
class Magic2 extends IDEntity {
  readonly a = 'second' as const;
  private b3 = false;
}
const magicSchema = Magic;
const magic2Schema = Magic2;

const unionSchema = new Union(
  {
    user: magicSchema,
    group: magic2Schema,
  },
  'a',
);
const errorUnionSchema = new Union(
  {
    user: magicSchema,
    group: magic2Schema,
  },
  // @ts-expect-error
  'notexistant',
);
const scheme = {
  thing: { data: unionSchema, members: [Magic] },
  first: '',
  second: '',
};
const schemeEntity = Magic;

const data = denormalize(scheme, {}, {});
const r = normalize(scheme, {});

type A = DenormalizeNullable<typeof scheme>;
type B = A['thing']['members'];
type C = DenormalizeNullable<typeof schemeEntity>;
type D = ReturnType<(typeof unionSchema)['_denormalizeNullable']>;
type F = Denormalize<typeof unionSchema>;
type E = Normalize<typeof scheme>['thing']['data'];

if (typeof data === 'symbol') {
  /*const piece = value.thing.data?.a;
  const first: string = value.first;
  const members = value.thing.members;*/
} else {
  const value = data.thing.data;
  const members = data.thing.members;
}

const schemeValues = new Values({ btc: Magic, eth: Magic2 });
const schemeValuesSimple = new Values(Magic);
const valueValues = denormalize(schemeValues, {}, {});
if (typeof valueValues !== 'symbol') {
  Object.keys(schemeValues).forEach(k => {
    const v = valueValues[k];
    if (v?.a === 'second') {
      const b: Magic2 = v;
    }
  });
}

const valueValuesSimple = denormalize(schemeValuesSimple, {}, {});
