import { Entity } from '@rest-hooks/endpoint';

class BaseEntity extends Entity {
  id = 0;

  pk() {
    return `${this.id}`;
  }
}

class User extends BaseEntity {
  static process(value, parent, key) {
    switch (key) {
      case 'author':
        return { ...value, posts: [parent.id] };
      case 'commenter':
        return { ...value, comments: [parent.id] };
      default:
        return { ...value };
    }
  }

  static merge(entityA, entityB) {
    return {
      ...entityA,
      ...entityB,
      posts: [...(entityA.posts || []), ...(entityB.posts || [])],
      comments: [...(entityA.comments || []), ...(entityB.comments || [])],
    };
  }
}
class Comment extends BaseEntity {
  static schema = {
    commenter: User,
  };

  static process(value, parent, key) {
    return { ...value, post: parent.id };
  }
}

class Post extends BaseEntity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}

export default [Post];
