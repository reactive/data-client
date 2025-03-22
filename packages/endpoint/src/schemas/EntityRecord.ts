import { Constructor, EntityOptions } from './EntityTypes.js';

export default function EntityRecord<TBase extends Constructor>(
  Base: TBase,
  options: EntityOptions<InstanceType<TBase>> = {},
) {}
