import PostContainer from './PostContainer';
import { UserResource, type Post, PostResource } from './resources';

export default function PostItem({ post }: { post: Post }) {
  const author = useSuspense(UserResource.get, { id: post.userId });
  const controller = useController();
  return (
    <PostContainer
      author={author}
      extra={
        <CancelButton
          onClick={() =>
            controller.fetch(PostResource.delete, {
              id: post.id,
            })
          }
        />
      }
    >
      {post.title}
    </PostContainer>
  );
}
