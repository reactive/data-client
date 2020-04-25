import { normalize, schema, SimpleRecord, AbstractInstanceType } from '../src';
import IDEntity from '../src/entities/IDEntity';

class User extends IDEntity {
  readonly posts: string[] = [];
  readonly comments: string[] = [];

  static fromJS<T extends typeof SimpleRecord>(
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

  static merge<T extends typeof SimpleRecord>(
    this: T,
    first: any,
    second: any,
  ) {
    // Apply everything from entityB over entityA, except for "favorites"
    const props = Object.assign(
      this.toObjectDefined(first),
      this.toObjectDefined(second),
      {
        posts: [...(first.posts || []), ...(second.posts || [])],
        comments: [...(first.comments || []), ...(second.comments || [])],
      },
    );
    return this.fromJS(props);
  }
}

class Comment extends IDEntity {
  static schema = { commenter: User.asSchema() };

  static fromJS<T extends typeof SimpleRecord>(
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
    author: User.asSchema(),
    comments: [Comment.asSchema()],
  };
}

const data = {
  /* ...*/
};
const normalizedData = normalize(data, Post);
console.log(normalizedData);
