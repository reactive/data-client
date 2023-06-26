import { UserResource, type Post } from './resources';

export default function PostItem({ post }: { post: Post }) {
  const author = useSuspense(UserResource.get, {
    id: post.userId,
  });
  return (
    <div style={{ display: 'flex', gap: '1em', marginBottom: '10px' }}>
      <div style={{ flex: '0 0 auto' }}>
        <img src={author.profileImage} height="32" width="32" />
      </div>
      <div>
        <h4>{post.title}</h4>
        <small>by {author.name}</small>
      </div>
    </div>
  );
}
