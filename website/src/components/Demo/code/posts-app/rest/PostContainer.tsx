import { type User } from './resources';

export default function PostContainer({
  children,
  author,
  extra = null,
}: {
  author: User;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="listItem">
      <Avatar src={author.profileImage} />
      <div>
        <h4>{children}</h4>
        <small>by {author.name}</small>
      </div>
      {extra}
    </div>
  );
}
