import { Controller } from '@rest-hooks/core';
import { lazy, Route } from '@anansi/router';
import { getImage } from '@rest-hooks/img';
import IssueResource from 'resources/IssueResource';
import ReactionResource from 'resources/ReactionResource';
import CommentResource from 'resources/CommentResource';
import UserResource from 'resources/UserResource';

const lazyPage = (pageName: string) =>
  lazy(
    () =>
      import(
        /* webpackChunkName: '[request]', webpackPrefetch: true */ `pages/${pageName}`
      ),
  );

export const namedPaths = {
  Home: '/',
  IssueDetail: '/issue/:number',
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
      controller.fetch(IssueResource.list(), match);
    },
  },
  {
    name: 'IssueDetail',
    component: lazyPage('IssueDetail'),
    resolveData: async (controller: Controller, match: { number: string }) => {
      const params = {
        owner: 'facebook',
        repo: 'react',
        number: match.number,
      };
      controller.fetch(ReactionResource.list(), params);
      controller.fetch(CommentResource.list(), params);
      await controller.fetch(IssueResource.detail(), params);
    },
  },
  {
    name: 'ProfileDetail',
    component: lazyPage('ProfileDetail'),
    resolveData: async (controller: Controller, match: { login: string }) => {
      controller.fetch(UserResource.detail(), match);
    },
  },
];
