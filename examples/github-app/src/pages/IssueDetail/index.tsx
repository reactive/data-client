import { Link } from '@anansi/router';
import { useSuspense, useFetch, useCache } from '@rest-hooks/react';
import { Card, Avatar, Popover } from 'antd';
import { Tag } from 'antd';
import Boundary from 'Boundary';
import FlexRow from 'components/FlexRow';
import Labels from 'components/Labels';
import { groupBy } from 'lodash';
import React, { useMemo, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import remarkRemoveComments from 'remark-remove-comments';
import { IssueResource } from 'resources/Issue';
import { ReactionResource, contentToIcon } from 'resources/Reaction';
import UserResource from 'resources/User';

import CommentsList, { CardLoading } from './CommentsList';
import CreateComment from './CreateComment';
import { CreateReaction } from './CreateReaction';
import { ReactionSpan } from './ReactionSpan';

const { Meta } = Card;

function IssueDetail({
  number: s,
  owner,
  repo,
}: {
  number: string;
  repo: string;
  owner: string;
}) {
  const number = Number.parseInt(s, 10);
  const params = {
    owner,
    repo,
    number,
  };

  useFetch(ReactionResource.getList, params);
  const issue = useSuspense(IssueResource.get, params);
  const { results: reactions } = useCache(ReactionResource.getList, params);
  const currentUser = useCache(UserResource.current);

  const actions: JSX.Element[] = useMemo(() => {
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
          title={
            <FlexRow>
              <span>{issue.title}</span>
              {issue.authorAssociation !== 'NONE' ? (
                <Tag>{capFirst(issue.authorAssociation)}</Tag>
              ) : null}
            </FlexRow>
          }
          description={
            <ErrorBoundary
              fallbackRender={({ error }) => <div>{error.message}</div>}
            >
              <Markdown
                remarkPlugins={[remarkRemoveComments, remarkGfm]}
                rehypePlugins={[() => rehypeHighlight({ ignoreMissing: true })]}
              >
                {issue.body}
              </Markdown>
            </ErrorBoundary>
          }
        />
      </Card>
      <link
        rel="stylesheet"
        href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.2/styles/github.min.css"
      ></link>
      <Boundary fallback={issue.comments ? <CardLoading /> : null}>
        <CommentsList {...params} />
      </Boundary>
      {currentUser ? <CreateComment issue={issue} /> : null}
    </React.Fragment>
  );
}
export default memo(IssueDetail);

function capFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase();
}
