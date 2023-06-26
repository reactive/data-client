import PostItem from './PostItem';
import ProfileEdit from './ProfileEdit';
import { PostResource } from './resources';

function PostList() {
  const userId = 1;
  const posts = useSuspense(PostResource.getList, { userId });
  return (
    <div>
      {posts.slice(0, 4).map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      <br />
      <ProfileEdit userId={userId} />
    </div>
  );
}
render(<PostList />);
