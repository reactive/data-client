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
    repositoryUrl: 'https://api.github.com/repos/facebook/react',
    resolveData: async (
      controller: Controller,
      match: { repositoryUrl: string },
    ) => {
      controller.fetch(IssueResource.list(), match);
    },
  },
  {
    name: 'IssueDetail',
    component: lazyPage('IssueDetail'),
    resolveData: async (controller: Controller, match: { number: string }) => {
      controller.fetch(ReactionResource.list(), {
        repositoryUrl: 'https://api.github.com/repos/facebook/react',
        number: match.number,
      });
      const issue = await controller.fetch(IssueResource.detail(), {
        repositoryUrl: 'https://api.github.com/repos/facebook/react',
        number: match.number,
      });
      controller.fetch(CommentResource.list(), {
        issueUrl: issue.url,
      });
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
