import React, { useMemo } from 'react';
import { useSuspense } from 'rest-hooks';
import { Card, List, Layout, Space, Timeline, Typography, Divider } from 'antd';
import Markdown from 'react-markdown';
import { Link } from '@anansi/router';
import { UserResource, User } from 'resources/User';
import RepositoryResource, { Repository } from 'resources/Repository';
import {
  BranchesOutlined,
  ForkOutlined,
  PullRequestOutlined,
  StarOutlined,
} from '@ant-design/icons';
import {
  EventResource,
  typeToIcon,
  Event,
  PullRequestEvent,
  IssuesEvent,
  PushEvent,
  PullRequestReviewEvent,
} from 'resources/Event';
import { groupBy } from 'lodash';

import FlexRow from '../../components/FlexRow';

const { Meta } = Card;
const { Sider, Content } = Layout;
const { Title, Text } = Typography;

function UserEvents({ user }: { user: User }) {
  const { results: events } = useSuspense(EventResource.getList, {
    login: user.login,
  });

  const timeline: [Event['type'], Event[]][] = useMemo(() => {
    const grouped = groupBy(events, (event) => event.type);
    const list = Object.entries(grouped);
    return list.filter(([type]) => visibleEventTypes.includes(type)) as any;
  }, [events]);

  return useMemo(
    () =>
      timeline.length > 0 ? (
        <section>
          <Title level={5}>Contribution activity</Title>
          <Divider orientation="left">
            {new Intl.DateTimeFormat(navigator.language, {
              month: 'long',
              year: 'numeric',
            }).format(events[0].createdAt)}
          </Divider>

          <Timeline>
            {timeline.map(([type, events]) => (
              <Timeline.Item key={type} dot={typeToIcon[type]}>
                <EventInTimeline type={type} events={events} />
              </Timeline.Item>
            ))}
          </Timeline>
        </section>
      ) : null,
    [events, timeline],
  );
}
export default UserEvents;
const visibleEventTypes = [
  'PushEvent',
  'PullRequestEvent',
  'PullRequestReviewEvent',
  'IssuesEvent',
];

function EventInTimeline({
  type,
  events,
}: {
  type: Event['type'];
  events: Event[];
}) {
  switch (type) {
    case 'PushEvent':
      return (
        <GenericEvents
          events={events as PushEvent[]}
          verb="Created"
          subject="commits"
        />
      );
    case 'PullRequestEvent':
      return <PREvents events={events as PullRequestEvent[]} />;
    case 'PullRequestReviewEvent':
      return (
        <GenericEvents
          events={events as PullRequestReviewEvent[]}
          verb="Reviewed"
          subject="pull requests"
        />
      );
    case 'IssuesEvent':
      return (
        <GenericEvents
          events={events as IssuesEvent[]}
          verb="Opened"
          subject="issues"
        />
      );
    default:
      return (
        <>
          {type}{' '}
          {new Intl.DateTimeFormat(navigator.language, {
            month: 'short',
            day: 'numeric',
          }).format(events[0].createdAt)}
        </>
      );
  }
}

function PREvents({ events }: { events: PullRequestEvent[] }) {
  const repoGrouped = groupBy(events, (event) => event.repo.name);
  return (
    <div>
      <Text strong>
        Opened {events.length} pull requests in{' '}
        {Object.keys(repoGrouped).length} repositories
      </Text>
      {Object.keys(repoGrouped).map((repokey) => (
        <PRGrouped key={repokey} events={repoGrouped[repokey]} />
      ))}
    </div>
  );
}

function PRGrouped({ events }: { events: PullRequestEvent[] }) {
  const repo = events[0].repo;
  const [owner, repoName] = repo.name.split('/');
  return (
    <div>
      <Link name="IssueList" props={{ owner, repo: repoName }}>
        {repo.name}
      </Link>
      <div>
        {events.map((event) => (
          <FlexRow key={event.pk()}>
            <span>
              <PRAction action={event.payload.action} />
              &nbsp;
              {event.payload.pullRequest.title}
            </span>
            <Text type="secondary">
              {new Intl.DateTimeFormat(navigator.language, {
                month: 'short',
                day: 'numeric',
              }).format(event.createdAt)}
            </Text>
          </FlexRow>
        ))}
      </div>
    </div>
  );
}
function PRAction({ action }: { action: 'closed' | 'opened' }) {
  switch (action) {
    case 'closed':
      return <BranchesOutlined style={{ color: 'rgb(130,80,223)' }} />;
    case 'opened':
      return <PullRequestOutlined style={{ color: 'rgb(26,127,55)' }} />;
  }
}

function GenericEvents({
  events,
  verb,
  subject,
}: {
  events: Event[];
  verb: string;
  subject: string;
}) {
  const repoGrouped = groupBy(events, (event) => event.repo.name);
  return (
    <div>
      <Text strong>
        {verb} {events.length} {subject} in {Object.keys(repoGrouped).length}{' '}
        repositories
      </Text>
      {Object.keys(repoGrouped).map((repokey) => (
        <RepoCommitGrouped
          key={repokey}
          events={repoGrouped[repokey]}
          subject={subject}
        />
      ))}
    </div>
  );
}

function RepoCommitGrouped({
  events,
  subject,
}: {
  events: Event[];
  subject: string;
}) {
  const repo = events[0].repo;
  const [owner, repoName] = repo.name.split('/');
  return (
    <FlexRow>
      <Link name="IssueList" props={{ owner, repo: repoName }}>
        {repo.name}
      </Link>
      <Text type="secondary">
        {events.length} {subject}
      </Text>
    </FlexRow>
  );
}
