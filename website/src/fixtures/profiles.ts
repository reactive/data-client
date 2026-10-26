import { GQLEndpoint } from '@data-client/graphql';
import { Entity, resource } from '@data-client/rest';

export class Profile extends Entity {
  id: number | undefined = undefined;
  img = '';
  fullName = '';
  bio = '';

  static key = 'Profile';
}

export const ProfileResource = resource({
  path: '/profiles/:id',
  schema: Profile,
});

const entities = {
  '1': {
    id: '1',
    fullName: 'Jing Chen',
    bio: 'Creator of Flux Architecture',
    avatar: 'https://avatars.githubusercontent.com/u/5050204?v=4&size=64',
  },
  '2': {
    id: '2',
    fullName: 'Dan Abramov',
    bio: 'Creator of redux, normalizr, and react hot reloading',
    avatar: 'https://avatars.githubusercontent.com/u/810438?v=4&size=64',
  },
};

const delay = 150;

export const detailFixtures = [
  {
    endpoint: ProfileResource.get,
    args: [{ id: 1 }],
    response: entities['1'],
    delay,
  },
  {
    endpoint: ProfileResource.get,
    args: [{ id: 2 }],
    response: entities['2'],
    delay,
  },
];

export const listFixtures = [
  {
    endpoint: ProfileResource.getList,
    args: [],
    response: Object.values(entities),
    delay,
  },
];

// GraphQL fixtures key on the query text (whitespace aside), so keep it
// identical to the useSuspense docs' ProfileResource.get
const getGQLProfile = new GQLEndpoint('/').query(
  `query GetProfile($id: ID!) {
    profile(id: $id) {
      id
      avatar
      fullName
      bio
    }
  }`,
);

export const gqlDetailFixtures = detailFixtures.map(
  ({ response, ...fixture }) => ({
    ...fixture,
    endpoint: getGQLProfile,
    response: { profile: response },
  }),
);
