import { normalize, denormalize } from '@rest-hooks/normalizr';

import { schema, Entity, AbstractInstanceType } from '../src';

class User extends Entity {
  id_str = '';
  name = '';

  pk() {
    return this.id_str;
  }
}

class Tweet extends Entity {
  id_str = '';
  url = '';
  user: User = new User();
  favorites: string[] = [];

  pk() {
    return this.id_str;
  }

  static schema = { user: User };

  static fromJS<T extends typeof Entity>(
    this: T,
    // TODO: this should only accept members that are not functions
    props: Partial<AbstractInstanceType<T>> = {},
    parent?: any,
    key?: string,
  ): AbstractInstanceType<T> {
    // Remove the URL field from the entity
    const { url, ...entityWithoutUrl } = props as Partial<Tweet>;
    return super.fromJS(entityWithoutUrl) as any;
  }

  static merge<T extends typeof Entity>(this: T, existing: any, incoming: any) {
    // Apply everything from entityB over entityA, except for "favorites"
    return {
      ...existing,
      ...incoming,
      favorites: (existing as Tweet).favorites,
    };
  }
}

const a: schema.EntityInterface<Tweet> = Tweet;

const data = {
  /* ...*/
};
const user = User;
const tweet = Tweet;

const normalizedData = normalize(data, tweet);
const denormalizedData = denormalize(
  normalizedData.result,
  tweet,
  normalizedData.entities,
);

const isTweet = tweet.key === 'tweets';
