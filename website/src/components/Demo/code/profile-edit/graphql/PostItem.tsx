import { type Post } from './resources';

export default function PostItem({ post }: { post: Post }) {
  return (
    <div className="listItem spaced">
      <Avatar src={post.author.profileImage} />
      <div>
        <h4>{post.title}</h4>
        <small>by {post.author.name}</small>
      </div>
    </div>
  );
}
