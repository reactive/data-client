import { getImage } from '..';

describe('<Img />', () => {
  it('fetch resolves in node', async () => {
    expect(
      await getImage({ src: 'http://test.com/myimage.png' }),
    ).toBeDefined();
  });
});
