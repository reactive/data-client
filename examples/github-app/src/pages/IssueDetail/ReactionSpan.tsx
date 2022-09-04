import { useSuspense, useController, useCache } from 'rest-hooks';
import React, { useCallback } from 'react';
import { UserResource } from 'resources/User';
import { v4 as uuid } from 'uuid';
import { Reaction, ReactionResource } from 'resources/Reaction';
import { Issue } from 'resources/Issue';
import { Tag } from 'antd';

const { CheckableTag } = Tag;

export function ReactionSpan({
  reactions,
  issue,
}: {
  reactions: Reaction[];
  issue: Issue;
}) {
  const { fetch } = useController();
  const currentUser = useCache(UserResource.current);
  const userReaction: Reaction | undefined = currentUser
    ? reactions.find((reaction) => reaction.user.login === currentUser.login)
    : undefined;
  const reactionContent = reactions[0].content;
  const handleClick = useCallback(
    (checked: boolean) => {
      if (!currentUser) return;
      if (!userReaction) {
        fetch(
          ReactionResource.create,
          {
            owner: issue.owner,
            number: issue.number,
            repo: issue.repo,
          },
          {
            content: reactionContent,
            id: uuid() as any as number,
            user: currentUser.login as any,
          },
        );
      } else {
        fetch(ReactionResource.delete, {
          owner: issue.owner,
          number: issue.number,
          repo: issue.repo,
          id: userReaction.id,
        });
      }
    },
    [
      currentUser,
      userReaction,
      fetch,
      issue.owner,
      issue.number,
      issue.repo,
      reactionContent,
    ],
  );
  return (
    <CheckableTag checked={!!userReaction} onChange={handleClick}>
      {reactions[0].contentIcon} {reactions.length}
    </CheckableTag>
  );
}
