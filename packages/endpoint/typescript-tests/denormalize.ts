import { normalize, denormalize } from '@rest-hooks/normalizr';
import { IDEntity } from '__tests__/new';

import { schema, DenormalizeNullable, Normalize, Denormalize } from '../src';

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

const unionSchema = new schema.Union(
  {
    user: magicSchema,
    group: magic2Schema,
  },
  'a',
);
const errorUnionSchema = new schema.Union(
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

const de = denormalize({}, scheme, {});
const r = normalize({}, scheme);

type A = DenormalizeNullable<typeof scheme>;
type B = A['thing']['members'];
type C = DenormalizeNullable<typeof schemeEntity>;
type D = ReturnType<typeof unionSchema['_denormalizeNullable']>;
type F = Denormalize<typeof unionSchema>;
type E = Normalize<typeof scheme>['thing']['data'];

if (de[1]) {
  const value = de[0];
  const piece = value.thing.data?.a;
  const first: string = value.first;
  const members = value.thing.members;
} else {
  const value = de[0];
  const data = value.thing.data;
  const members = value.thing.members;
}
const members2 = de[0].thing.members;

const schemeValues = new schema.Values({ btc: Magic, eth: Magic2 });
const schemeValuesSimple = new schema.Values(Magic);
const [valueValues, foundValues] = denormalize({}, schemeValues, {});
Object.keys(schemeValues).forEach(k => {
  const v = valueValues[k];
  if (v?.a === 'second') {
    const b: Magic2 = v;
  }
});

const [valueValuesSimple, foundValuesSimple] = denormalize(
  {},
  schemeValuesSimple,
  {},
);
