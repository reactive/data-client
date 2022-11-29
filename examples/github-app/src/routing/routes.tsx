import { lazy, Route } from '@anansi/router';
import { getImage } from '@rest-hooks/img';
import { Controller } from '@rest-hooks/react';
import CommentResource from 'resources/Comment';
import { EventResource } from 'resources/Event';
import IssueResource from 'resources/Issue';
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
      match: { owner: string; repo: string },
    ) => {
      controller.fetch(IssueResource.getList, match);
    },
  },
  {
    name: 'IssueList',
    component: lazyPage('IssueList'),
    resolveData: async (
      controller: Controller,
      match: { owner: string; repo: string },
    ) => {
      controller.fetch(IssueResource.getList, match);
    },
  },
  {
    name: 'IssueDetail',
    component: lazyPage('IssueDetail'),
    resolveData: async (
      controller: Controller,
      match: { owner: string; repo: string; number: string },
    ) => {
      const params = match;
      controller.fetch(ReactionResource.getList, params);
      controller.fetch(CommentResource.getList, params);
      await controller.fetch(IssueResource.get, params);
    },
  },
  {
    name: 'ProfileDetail',
    component: lazyPage('ProfileDetail'),
    resolveData: async (controller: Controller, match: { login: string }) => {
      controller.fetch(UserResource.get, match);
      controller.fetch(RepositoryResource.getByUser, match);
      const { data: currentUser } = controller.getResponse(
        UserResource.current,
        controller.getState(),
      );
      if (currentUser) controller.fetch(RepositoryResource.getByPinned, match);
      controller.fetch(EventResource.getList, match);
    },
  },
];
