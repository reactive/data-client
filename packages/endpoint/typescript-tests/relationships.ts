import { normalize } from '@rest-hooks/normalizr';

import { schema, Entity, AbstractInstanceType } from '../src';

/** Represents data with primary key being from 'id' field. */
export class IDEntity extends Entity {
  readonly id: string | number | undefined = undefined;

  /**
   * A unique identifier for each Entity
   *
   * @param [parent] When normalizing, the object which included the entity
   * @param [key] When normalizing, the key where this entity was found
   */
  pk(parent?: any, key?: string): string | undefined {
    return `${this.id}`;
  }
}

class User extends IDEntity {
  readonly posts: string[] = [];
  readonly comments: string[] = [];

  static fromJS<T extends typeof Entity>(
    this: T,
    props: Partial<AbstractInstanceType<T>> = {},
    parent?: any,
    key?: string,
  ): AbstractInstanceType<T> {
    switch (key) {
      case 'author':
        return super.fromJS({
          ...(props as Partial<User>),
          posts: [parent.id],
        } as any) as any;
      case 'commenter':
        return super.fromJS({
          ...(props as Partial<User>),
          comments: [parent.id],
        } as any) as any;
      default:
        return super.fromJS(props) as any;
    }
  }

  static merge<T extends typeof Entity>(this: T, existing: any, incoming: any) {
    // Apply everything from entityB over entityA, except for "favorites"
    return {
      ...existing,
      ...incoming,
      posts: [...(existing.posts || []), ...(incoming.posts || [])],
      comments: [...(existing.comments || []), ...(incoming.comments || [])],
    };
  }
}

class Comment extends IDEntity {
  static schema = { commenter: User };

  static fromJS<T extends typeof Entity>(
    this: T,
    props: Partial<AbstractInstanceType<T>> = {},
    parent?: any,
    key?: string,
  ): AbstractInstanceType<T> {
    return super.fromJS({ ...props, post: parent.id }) as any;
  }
}

class Post extends IDEntity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}

const data = {
  /* ...*/
};
const normalizedData = normalize(data, Post);
console.log(normalizedData);
