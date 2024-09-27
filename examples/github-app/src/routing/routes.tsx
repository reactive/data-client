import { getImage } from '@data-client/img';
import { Controller } from '@data-client/react';
import CommentResource from 'resources/Comment';
import { EventResource } from 'resources/Event';
import IssueResource from 'resources/Issue';
import ReactionResource from 'resources/Reaction';
import RepositoryResource from 'resources/Repository';
import UserResource from 'resources/User';

import { lazyPage } from './lazyPage';

export const routes = [
  {
    name: 'Home',
    component: lazyPage('IssuesPage'),
    owner: 'facebook',
    repo: 'react',
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
      search: URLSearchParams,
    ) => {
      const query = `${search?.get('query') || 'is:open'} is:issue`;
      const q = `${query} repo:${owner}/${repo}`;
      controller.fetchIfStale(IssueResource.search, { q });
    },
  },
  {
    name: 'PullList',
    component: lazyPage('PullsPage'),
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
      search: URLSearchParams,
    ) => {
      const query = `${search?.get('query') || 'is:open'} is:pr`;
      const q = `${query} repo:${owner}/${repo}`;
      await controller.fetchIfStale(IssueResource.search, {
        q,
      });
    },
  },
  {
    name: 'IssueList',
    component: lazyPage('IssuesPage'),
    title: 'issue list',
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
      search: URLSearchParams,
    ) => {
      const query = `${search?.get('query') || 'is:open'} is:issue`;
      const q = `${query} repo:${owner}/${repo}`;
      await controller.fetchIfStale(IssueResource.search, {
        q,
      });
    },
  },
  {
    name: 'IssueDetail',
    component: lazyPage('IssueDetail'),
    resolveData: async (
      controller: Controller,
      { owner, repo, number }: { owner: string; repo: string; number: string },
    ) => {
      controller.fetchIfStale(ReactionResource.getList, {
        owner,
        repo,
        number,
      });
      controller.fetchIfStale(CommentResource.getList, { owner, repo, number });
      await controller.fetchIfStale(IssueResource.get, { owner, repo, number });
    },
  },
  {
    name: 'ProfileDetail',
    component: lazyPage('ProfileDetail'),
    resolveData: async (
      controller: Controller,
      { login }: { login: string },
    ) => {
      controller.fetchIfStale(UserResource.get, { login });
      controller.fetchIfStale(RepositoryResource.getByUser, { login });
      const { data: currentUser } = controller.getResponse(
        UserResource.current,
        controller.getState(),
      );
      if (currentUser)
        controller.fetchIfStale(RepositoryResource.getByPinned, { login });
      controller.fetchIfStale(EventResource.getList, { login });
    },
  },
];

export const namedPaths = {
  Home: '/',
  PullList: '/:owner/:repo/pulls',
  IssueList: '/:owner/:repo/issues',
  IssueDetail: '/:owner/:repo/issue/:number',
  ProfileDetail: '/users/:login',
};
