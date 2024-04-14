import { Link } from '@anansi/router';
import { useSuspense, useCache, useDLE } from '@data-client/react';
import { Card, Avatar } from 'antd';
import { Tag } from 'antd';
import Boundary from 'Boundary';
import FlexRow from 'components/FlexRow';
import React, { useMemo, memo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import remarkRemoveComments from 'remark-remove-comments';
import { IssueResource } from 'resources/Issue';
import { ReactionResource } from 'resources/Reaction';
import UserResource from 'resources/User';

import CommentsList, { CardLoading } from './CommentsList';
import CreateComment from './CreateComment';
import { issueActions } from './issueActions';

const { Meta } = Card;

function IssueDetail({ number, repo, owner }: Props) {
  const params = { number, repo, owner };
  const {
    data: { results: reactions },
  } = useDLE(ReactionResource.getList, params);
  const issue = useSuspense(IssueResource.get, params);
  const currentUser = useCache(UserResource.current);

  const actions: JSX.Element[] = useMemo(
    () => issueActions(reactions, issue),
    [reactions, issue],
  );

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
                rehypePlugins={[rehypeHighlight]}
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

interface Props {
  number: string;
  repo: string;
  owner: string;
}

function capFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase();
}
