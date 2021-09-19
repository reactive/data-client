import { useResource, useController, useRetrieve, useCache } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import { groupBy } from 'lodash';
import React, { useMemo, memo } from 'react';
import { RouteChildrenProps } from 'react-router';
import Markdown from 'react-markdown';
import Boundary from 'Boundary';

import IssueResource from '../../resources/IssueResource';
import ReactionResource from '../../resources/ReactionResource';
import CommentsList, { CardLoading } from './CommentsList';

const { Meta } = Card;

type Props = Pick<IssueResource, 'repositoryUrl'>;

function ReactionSpan({
  reactions,
  issue,
}: {
  reactions: ReactionResource[];
  issue: IssueResource;
}) {
  const { fetch } = useController();
  const handleClick = () => {
    fetch(
      ReactionResource.create(),
      { repositoryUrl: issue.repositoryUrl, number: issue.number },
      { content: reactions[0].content },
    );
  };
  return (
    <span onClick={handleClick}>
      {reactions[0].contentIcon} {reactions.length}
    </span>
  );
}

function IssueDetail({ match }: RouteChildrenProps<{ number: string }>) {
  let number = 1;
  if (match && match.params && match.params.number) {
    number = Number.parseInt(match.params.number, 10);
  }
  useRetrieve(ReactionResource.list(), {
    repositoryUrl: 'https://api.github.com/repos/facebook/react',
    number,
  });
  const [issue] = useResource([
    IssueResource.detail(),
    {
      repositoryUrl: 'https://api.github.com/repos/facebook/react',
      number,
    },
  ]);
  const { results: reactions } = useCache(ReactionResource.list(), {
    repositoryUrl: 'https://api.github.com/repos/facebook/react',
    number,
  });

  const actions: JSX.Element[] = useMemo(() => {
    const grouped = groupBy(reactions, (reaction) => reaction.content);
    return Object.entries(grouped).map(([k, v]) => (
      <ReactionSpan key={k} reactions={v} issue={issue} />
    ));
  }, [reactions, issue]);

  return (
    <React.Fragment>
      <Card actions={actions}>
        <Meta
          avatar={<Avatar src={issue.user.avatarUrl} />}
          title={issue.title}
          description={<Markdown>{issue.body}</Markdown>}
        />
      </Card>
      {issue.comments ? (
        <Boundary fallback={<CardLoading />}>
          <CommentsList issueUrl={issue.url} />
        </Boundary>
      ) : null}
    </React.Fragment>
  );
}
export default memo(IssueDetail);
