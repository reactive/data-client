import { Popover } from 'antd';
import { groupBy } from 'lodash';
import React from 'react';

import Labels from '@/components/Labels';
import { type Issue } from '@/resources/Issue';
import { contentToIcon, type Reaction } from '@/resources/Reaction';

import { CreateReaction } from './CreateReaction';
import { ReactionSpan } from './ReactionSpan';

export function issueActions(reactions: Reaction[] | undefined, issue: Issue) {
  const grouped = groupBy(reactions, (reaction) => reaction.content);
  const list = Object.entries(grouped)
    .map(([k, v]) => <ReactionSpan key={k} reactions={v} issue={issue} />)
    .concat(<Labels labels={issue.labels} />);
  list.unshift(
    <Popover
      placement="bottomRight"
      content={Object.keys(contentToIcon).map((content: any) => (
        <CreateReaction
          key={content}
          content={content}
          issue={issue}
          reactions={grouped[content]}
        />
      ))}
      trigger="hover"
    >
      😄
    </Popover>,
  );
  return list;
}
