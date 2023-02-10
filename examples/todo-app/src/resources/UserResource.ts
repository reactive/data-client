import {
  createPlaceholderResource,
  PlaceholderEntity,
} from './PlaceholderBaseResource';

export class User extends PlaceholderEntity {
  name = '';
  username = '';
  email = '';
  phone = '';
  website = '';
  address: Address = {} as any;
  company: Company = {} as any;

  get addressDisplay() {
    return `${this.address?.street} ${this.address?.city}`;
  }

  get coverImage() {
    return `http://placekitten.com/800/200?image=${this.id}`;
  }

  get coverImageFallback() {
    return `http://placekitten.com/80/20?image=${this.id}`;
  }

  get coverBackgroundImage() {
    return `url('${this.coverImage}'), url('${this.coverImageFallback}')`;
  }

  get profileImage() {
    return `https://i.pravatar.cc/256?img=${this.id + 4}`;
  }

  static get key() {
    return 'User';
  }
}

export const UserResource = createPlaceholderResource({
  path: '/users/:id',
  schema: User,
});

export interface Address {
  readonly street: string;
  readonly suite: string;
  readonly city: string;
  readonly zipcode: string;
  readonly geo: {
    readonly lat: string;
    readonly lng: string;
  } | null;
}
export interface Company {
  readonly name: string;
  readonly catchPhrase: string;
  readonly bs: string;
}
