import PostItem from './PostItem';
import ProfileEdit from './ProfileEdit';
import { PostResource } from './resources';

function PostList() {
  const userId = 1;
  const { posts } = useSuspense(PostResource.getList, { userId });
  return (
    <div>
      <ProfileEdit userId={userId} />
      <br />
      <br />
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
    </div>
  );
}
render(<PostList />);
