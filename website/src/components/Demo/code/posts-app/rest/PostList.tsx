import NewPost from './NewPost';
import PostItem from './PostItem';
import { PostResource } from './resources';

function PostList() {
  const userId = 1;
  const posts = useSuspense(PostResource.getList, { userId });
  return (
    <div>
      {posts.map(post => (
        <PostItem key={post.pk()} post={post} />
      ))}
      <NewPost userId={userId} />
    </div>
  );
}
render(<PostList />);
