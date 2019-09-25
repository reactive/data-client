export const payload = {
  id: 5,
  title: 'hi ho',
  content: 'whatever',
  tags: ['a', 'best', 'react'],
};

export const articlesPages = {
  prevPage: '23asdl',
  nextPage: 's3f3',
  results: [
    {
      id: 23,
      title: 'the first draft',
      content: 'the best things in life com efree',
      tags: ['one', 'two'],
    },
    {
      id: 44,
      title: 'the second book',
      content: 'the best things in life com efree',
      tags: ['hbh', 'wew'],
    },
    {
      id: 2,
      title: 'the third novel',
      content: 'the best things in life com efree',
      tags: ['free', 'honey'],
    },
    {
      id: 643,
      title: 'a long time ago',
      content: 'the best things in life com efree',
    },
  ],
};

export const users = [
  {
    id: 23,
    username: 'bob',
    email: 'bob@bob.com',
    isAdmin: false,
  },
  {
    id: 7342,
    username: 'lindsey',
    email: 'lindsey@bob.com',
    isAdmin: true,
  },
];

export const nested = [
  {
    id: 5,
    title: 'hi ho',
    content: 'whatever',
    tags: ['a', 'best', 'react'],
    author: {
      id: 23,
      username: 'bob',
    },
  },
  {
    id: 3,
    title: 'the next time',
    content: 'whatever',
    author: {
      id: 23,
      username: 'charles',
      email: 'bob@bob.com',
    },
  },
];

describe('fixtures', () => {
  it('should pass', () => {});
});
