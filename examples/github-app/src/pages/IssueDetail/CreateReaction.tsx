import { useController, useCache } from 'rest-hooks';
import { UserResource } from 'resources/User';
import { v4 as uuid } from 'uuid';
import { Reaction, ReactionResource, contentToIcon } from 'resources/Reaction';
import { Issue } from 'resources/Issue';
import { Tag } from 'antd';

const { CheckableTag } = Tag;

export function CreateReaction({
  content,
  reactions = [],
  issue,
}: {
  reactions: Reaction[];
  content: keyof typeof contentToIcon;
  issue: Issue;
}) {
  const { fetch } = useController();
  const currentUser = useCache(UserResource.current);
  const userReaction: Reaction | undefined =
    currentUser &&
    reactions.find((reaction) => reaction.user.login === currentUser.login);

  const handleClick = () => {
    if (userReaction || !currentUser) return;
    fetch(
      ReactionResource.create,
      {
        owner: issue.owner,
        number: issue.number,
        repo: issue.repo,
      },
      { content, id: uuid() as any as number, user: currentUser.login as any },
    );
  };
  return (
    <CheckableTag checked={false} onChange={handleClick}>
      {contentToIcon[content]}
    </CheckableTag>
  );
}
