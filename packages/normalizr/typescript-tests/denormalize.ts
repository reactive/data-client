import { denormalize, normalize, schema, DenormalizeNullable, Normalize } from '../index';

class Magic {
  readonly a: 'first';
  private b: boolean;
  c: 'arg';
}
class Magic2 {
  readonly a: 'second';
  private b3: boolean;
}

const magicEntity = new schema.Entity(
  'a',
  {},
  { processStrategy: (value: any, parent: any, key: string) => new Magic() }
);
const magicEntity2 = new schema.Entity(
  'b',
  {},
  { processStrategy: (value: any, parent: any, key: string) => new Magic2() }
);
const unionSchema = new schema.Union(
  {
    user: magicEntity,
    group: magicEntity2
  },
  'a'
);
const scheme = { thing: { data: unionSchema, members: [magicEntity] }, first: '', second: '' };
const schemeEntity = magicEntity;

const de = denormalize({}, scheme, {});
const r = normalize({}, scheme);

type A = DenormalizeNullable<typeof scheme>;
type B = A['thing']['members'];
type C = DenormalizeNullable<typeof schemeEntity>;
type D = ReturnType<typeof magicEntity['_denormalizeNullable']>;
type E = Normalize<typeof scheme>['thing']['data'];

if (de[1]) {
  const value = de[0];
  const piece = value.thing.data.a;
  const first: string = value.first;
  const members = value.thing.members;
} else {
  const value = de[0];
  const data = value.thing.data;
  const members = value.thing.members;
}
const members2 = de[0].thing.members;

const schemeValues = new schema.Values({ btc: magicEntity, eth: magicEntity2 });
const schemeValuesSimple = new schema.Values(magicEntity);
const [valueValues, foundValues] = denormalize({}, schemeValues, {});
Object.keys(schemeValues).forEach((k) => {
  const v = valueValues[k];
  if (v && v.a === 'second') {
    const b: Magic2 = v;
  }
});

const [valueValuesSimple, foundValuesSimple] = denormalize({}, schemeValuesSimple, {});
