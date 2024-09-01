import { Entity } from '@data-client/endpoint';

class User extends Entity {
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
class Comment extends Entity {
  static schema = {
    commenter: User,
  };

  static process(value, parent) {
    return { ...value, post: parent.id };
  }
}

class Post extends Entity {
  static schema = {
    author: User,
    comments: [Comment],
  };
}

export default [Post];
