import { RestEndpoint } from '@data-client/rest';

// out of every sort order, so the first one already moves the rows
const members = [
  { id: '4', name: 'Maya Chen', isAdmin: true, posts: 412, joined: 2018 },
  { id: '7', name: 'Leo Fischer', isAdmin: false, posts: 36, joined: 2024 },
  { id: '2', name: 'Ama Owusu', isAdmin: false, posts: 187, joined: 2020 },
  { id: '9', name: 'Sofia Reyes', isAdmin: true, posts: 95, joined: 2022 },
  { id: '3', name: 'Ravi Kumar', isAdmin: false, posts: 268, joined: 2019 },
  { id: '5', name: 'Hana Sato', isAdmin: false, posts: 71, joined: 2023 },
  { id: '8', name: 'Elias Berg', isAdmin: true, posts: 153, joined: 2017 },
];

export const teamFixtures = [
  {
    endpoint: new RestEndpoint({ path: '/users' }),
    args: [],
    response: members,
    delay: 150,
  },
];
