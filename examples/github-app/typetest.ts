/* eslint-disable react-hooks/rules-of-hooks */
import {
  useCache,
  useController,
  useLive,
  useSuspense,
} from '@data-client/react';

import { CommentResource } from './src/resources/Comment';
import { IssueResource } from './src/resources/Issue';
import ReactionResource, { Reaction } from './src/resources/Reaction';
import RepositoryResource from './src/resources/Repository';
import UserResource from './src/resources/User';

function useTest() {
  const ctrl = useController();

  const params = {
    owner: 'ntucker',
    repo: 'rest-hooks',
    page: '1',
  };
  const { results: issues, link } = useLive(IssueResource.getList, params);
  useSuspense(IssueResource.getList, {
    owner: 'ntucker',
    repo: 'rest-hooks',
  });

  issues.map((issue) => {
    issue.pk();
    issue.body;
    ctrl.fetch(
      IssueResource.partialUpdate,
      {
        owner: issue.owner,
        repo: issue.repo,
        number: issue.number,
      },
      { body: 'hi' },
    );

    ctrl.fetch(
      CommentResource.create,
      { owner: issue.owner, repo: issue.repo, number: issue.number },
      { body: 'hi' },
    );

    const { results: reactions } = useCache(ReactionResource.getList, {
      owner: issue.owner,
      repo: issue.repo,
      number: issue.number,
    });
    if (!reactions) return;
    const userReaction: Reaction | undefined = currentUser
      ? reactions.find((reaction) => reaction.user.login === currentUser.login)
      : undefined;
    const reactionContent = reactions[0].content;
    if (!currentUser) return;
    if (!userReaction) {
      ctrl.fetch(
        ReactionResource.create,
        {
          owner: issue.owner,
          number: issue.number,
          repo: issue.repo,
        },
        {
          content: reactionContent,
          id: 5,
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
  });

  const user = useSuspense(UserResource.get, { login: 'ntucker' });
  user.bio;
  user.email;

  const currentUser = useCache(UserResource.current);
  currentUser?.blog;
  const pinned = useSuspense(
    RepositoryResource.getByPinned,
    currentUser
      ? {
          login: user.login,
        }
      : null,
  );
  const { results } = useSuspense(RepositoryResource.getByUser, {
    login: user.login,
  });
  let repos = pinned.user.pinnedItems.nodes ?? [];
  if (!repos.length) {
    repos = [...results.filter((repo) => !repo.fork)];
    repos.sort((a, b) => b.stargazersCount - a.stargazersCount);
    repos = repos.slice(0, 6);
  }
}
