import { DataProvider } from '@data-client/react';
import { render, waitFor } from '@testing-library/react';
import { Suspense } from 'react';

import { Img } from '..';

describe('<Img />', () => {
  let imgs: HTMLImageElement[];
  beforeEach(() => {
    imgs = [];
    function MockImg(
      this: HTMLImageElement,
      width?: number | undefined,
      height?: number | undefined,
    ) {
      imgs.push(this);
      return this;
    }
    MockImg.prototype = Image;
    jest.spyOn(globalThis, 'Image').mockImplementation(MockImg);
  });

  it('suspends then resolves', async () => {
    const tree = (
      <DataProvider>
        <Suspense fallback="loading">
          <Img src="http://test.com/myimage.png" alt="myimage" />
        </Suspense>
      </DataProvider>
    );
    const { queryByText, getByAltText } = render(tree);
    expect(queryByText('loading')).not.toBeNull();

    imgs.forEach(img => img.onload?.(new Event('img load')));

    await waitFor(() => expect(getByAltText('myimage')).not.toBeNull());
  });

  it('suspends then resolves with custom component', async () => {
    function MyComponent({
      src,
      size,
    }: {
      src: string;
      size: 'large' | 'small';
    }) {
      return (
        <div
          style={{ fontSize: size === 'large' ? '36px' : '16px' }}
          data-testid="mycomponent"
        >
          {src}
        </div>
      );
    }
    () => {
      <Img
        component={MyComponent}
        src="http://test.com/myimage.png"
        //@ts-expect-error
        size={5}
      />;
      //@ts-expect-error
      <Img component={MyComponent} src="http://test.com/myimage.png" />;
      //@ts-expect-error
      <Img component={MyComponent} size="large" />;
    };
    const tree = (
      <DataProvider>
        <Suspense fallback="loading">
          <Img
            component={MyComponent}
            src="http://test.com/myimage.png"
            size="large"
          />
        </Suspense>
      </DataProvider>
    );
    const { queryByText, getByTestId } = render(tree);
    expect(queryByText('loading')).not.toBeNull();

    imgs.forEach(img => img.onload?.(new Event('img load')));

    await waitFor(() => expect(getByTestId('mycomponent')).not.toBeNull());
  });

  it('still resolves even when network request fails', async () => {
    const tree = (
      <DataProvider>
        <Suspense fallback="loading">
          <Img src="http://test.com/myimage.png" alt="myimage" />
        </Suspense>
      </DataProvider>
    );
    const { queryByText, getByAltText } = render(tree);
    expect(queryByText('loading')).not.toBeNull();

    imgs.forEach(img => img.onerror?.(new Event('img load')));

    await waitFor(() => expect(getByAltText('myimage')).not.toBeNull());
  });

  it('no suspense and no fetch with no src', async () => {
    const tree = (
      <DataProvider>
        <Suspense fallback="loading">
          <Img alt="myimage" />
        </Suspense>
      </DataProvider>
    );
    const { getByAltText } = render(tree);

    await waitFor(() => expect(getByAltText('myimage')).not.toBeNull());
  });
});
