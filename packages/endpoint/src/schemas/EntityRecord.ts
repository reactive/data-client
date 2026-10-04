import {
  Constructor,
  ConstructorInstance,
  EntityOptions,
} from './EntityTypes.js';

export default function EntityRecord<TBase extends Constructor>(
  Base: TBase,
  options: EntityOptions<ConstructorInstance<TBase>> = {},
) {}
