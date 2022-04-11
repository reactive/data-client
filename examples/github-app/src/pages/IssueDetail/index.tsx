import { useSuspense, useController, useFetch, useCache } from 'rest-hooks';
import { Card, Avatar } from 'antd';
import { groupBy } from 'lodash';
import React, { useMemo, memo } from 'react';
import Markdown from 'react-markdown';
import Boundary from 'Boundary';
import { Link } from '@anansi/router';
import Labels from 'components/Labels';

import IssueResource from '../../resources/IssueResource';
import ReactionResource from '../../resources/ReactionResource';
import CommentsList, { CardLoading } from './CommentsList';

const { Meta } = Card;

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

function IssueDetail({ number: s }: { number: string }) {
  const number = Number.parseInt(s, 10);
  const params = {
    owner: 'facebook',
    repo: 'react',
    number,
  };

  useFetch(ReactionResource.list(), params);
  const issue = useSuspense(IssueResource.detail(), params);
  const { results: reactions } = useCache(ReactionResource.list(), params);

  const actions: JSX.Element[] = useMemo(() => {
    const grouped = groupBy(reactions, (reaction) => reaction.content);
    return Object.entries(grouped)
      .map(([k, v]) => <ReactionSpan key={k} reactions={v} issue={issue} />)
      .concat(<Labels labels={issue.labels} />);
  }, [reactions, issue]);

  return (
    <React.Fragment>
      <Card actions={actions}>
        <Meta
          avatar={
            <Link name="ProfileDetail" props={{ login: issue.user.login }}>
              <Avatar src={issue.user.avatarUrl} />
            </Link>
          }
          title={issue.title}
          description={<Markdown>{issue.body}</Markdown>}
        />
      </Card>
      {issue.comments ? (
        <Boundary fallback={<CardLoading />}>
          <CommentsList {...params} />
        </Boundary>
      ) : null}
    </React.Fragment>
  );
}
export default memo(IssueDetail);
