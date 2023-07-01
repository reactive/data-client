import { lazy, Route } from '@anansi/router';
import { getImage } from '@rest-hooks/img';
import { Controller } from '@rest-hooks/react';
import CommentResource from 'resources/Comment';
import { EventResource } from 'resources/Event';
import IssueResource from 'resources/Issue';
import PullResource from 'resources/Pull';
import ReactionResource from 'resources/Reaction';
import RepositoryResource from 'resources/Repository';
import UserResource from 'resources/User';

const lazyPage = (pageName: string) =>
  lazy(
    () =>
      import(
        /* webpackChunkName: '[request]', webpackPrefetch: true */ `pages/${pageName}`
      ),
  );

export const namedPaths = {
  Home: '/',
  PullList: '/:owner/:repo/pulls',
  IssueList: '/:owner/:repo/issues',
  IssueDetail: '/:owner/:repo/issue/:number',
  ProfileDetail: '/users/:login',
};

export const routes = [
  {
    name: 'Home',
    component: lazyPage('IssueList'),
    owner: 'facebook',
    repo: 'react',
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
    ) => {
      controller.fetch(IssueResource.getList, { owner, repo });
    },
  },
  {
    name: 'PullList',
    component: lazyPage('PullList'),
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
    ) => {
      controller.fetch(PullResource.getList, {
        owner,
        repo,
        state: 'open',
      });
    },
  },
  {
    name: 'IssueList',
    component: lazyPage('IssueList'),
    resolveData: async (
      controller: Controller,
      { owner, repo }: { owner: string; repo: string },
    ) => {
      controller.fetch(IssueResource.getList, { owner, repo });
    },
  },
  {
    name: 'IssueDetail',
    component: lazyPage('IssueDetail'),
    resolveData: async (
      controller: Controller,
      { owner, repo, number }: { owner: string; repo: string; number: string },
    ) => {
      controller.fetch(ReactionResource.getList, { owner, repo, number });
      controller.fetch(CommentResource.getList, { owner, repo, number });
      await controller.fetch(IssueResource.get, { owner, repo, number });
    },
  },
  {
    name: 'ProfileDetail',
    component: lazyPage('ProfileDetail'),
    resolveData: async (
      controller: Controller,
      { login }: { login: string },
    ) => {
      controller.fetch(UserResource.get, { login });
      controller.fetch(RepositoryResource.getByUser, { login });
      const { data: currentUser } = controller.getResponse(
        UserResource.current,
        controller.getState(),
      );
      if (currentUser)
        controller.fetch(RepositoryResource.getByPinned, { login });
      controller.fetch(EventResource.getList, { login });
    },
  },
];
