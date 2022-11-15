import { getImage } from '..';

export default {
  found: [
    {
      endpoint: getImage,
      args: [{ src: 'http://test.com/myimage.png' }],
      response: 'http://test.com/myimage.png',
    },
  ],
  error: [
    {
      endpoint: getImage,
      args: [{ src: 'http://test.com/myimage.png' }],
      response: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
};
describe('fixtures', () => {
  it('should pass', () => {});
});
