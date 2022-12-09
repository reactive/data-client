import { useController, useCache } from '@rest-hooks/react';
import { Tag } from 'antd';
import { Issue } from 'resources/Issue';
import { Reaction, ReactionResource, contentToIcon } from 'resources/Reaction';
import { UserResource } from 'resources/User';
import { v4 as uuid } from 'uuid';

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
  const ctrl = useController();
  const currentUser = useCache(UserResource.current);
  const userReaction: Reaction | undefined =
    currentUser &&
    reactions.find((reaction) => reaction.user.login === currentUser.login);

  const handleClick = () => {
    if (userReaction || !currentUser) return;
    ctrl.fetch(
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
