import { useController, useCache } from '@data-client/react';
import { Tag } from 'antd';
import React, { useCallback } from 'react';
import { v4 as uuid } from 'uuid';

import { Issue } from '@/resources/Issue';
import { Reaction, ReactionResource } from '@/resources/Reaction';
import { UserResource } from '@/resources/User';

const { CheckableTag } = Tag;

export function ReactionSpan({
  reactions,
  issue,
}: {
  reactions: Reaction[];
  issue: Issue;
}) {
  const ctrl = useController();
  const currentUser = useCache(UserResource.current);
  const userReaction: Reaction | undefined = currentUser
    ? reactions.find((reaction) => reaction.user.login === currentUser.login)
    : undefined;
  const reactionContent = reactions[0].content;
  const handleClick = useCallback(
    (checked: boolean) => {
      if (!currentUser) return;
      if (!userReaction) {
        ctrl.fetch(
          ReactionResource.getList.push,
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
        ctrl.fetch(ReactionResource.delete, {
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
      ctrl,
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
