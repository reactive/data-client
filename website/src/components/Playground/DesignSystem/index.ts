export { CancelButton } from './CancelButton';
export { CurrentTime } from './CurrentTime';
export { Avatar } from './Avatar';
export { Formatted } from './Formatted';
export class FloatSerializer extends Number {
  constructor(v: any) {
    super(Number.parseFloat(v));
  }
}
