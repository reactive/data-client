import { getImage } from '..';

export default {
  found: [
    {
      request: getImage,
      params: { src: 'http://test.com/myimage.png' },
      result: 'http://test.com/myimage.png',
    },
  ],
  error: [
    {
      request: getImage,
      params: { src: 'http://test.com/myimage.png' },
      result: { message: 'Bad request', status: 400, name: 'Not Found' },
      error: true,
    },
  ],
};
describe('fixtures', () => {
  it('should pass', () => {});
});
