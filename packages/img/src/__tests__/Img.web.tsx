import { CacheProvider } from '@rest-hooks/core';
import { getByTestId, render, waitFor } from '@testing-library/react';
import React, { Suspense } from 'react';

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
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('suspends then resolves', async () => {
    const tree = (
      <CacheProvider>
        <Suspense fallback="loading">
          <Img src="http://test.com/myimage.png" alt="myimage" />
        </Suspense>
      </CacheProvider>
    );
    const { queryByText, getByAltText } = render(tree);
    expect(queryByText('loading')).toBeDefined();

    imgs.forEach(img => img.onload?.(new Event('img load')));

    await waitFor(() => expect(getByAltText('myimage')).toBeDefined());
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
      <CacheProvider>
        <Suspense fallback="loading">
          <Img
            component={MyComponent}
            src="http://test.com/myimage.png"
            size="large"
          />
        </Suspense>
      </CacheProvider>
    );
    const { queryByText, getByTestId } = render(tree);
    expect(queryByText('loading')).toBeDefined();

    imgs.forEach(img => img.onload?.(new Event('img load')));

    await waitFor(() => expect(getByTestId('mycomponent')).toBeDefined());
  });

  it('still resolves even when network request fails', async () => {
    const tree = (
      <CacheProvider>
        <Suspense fallback="loading">
          <Img src="http://test.com/myimage.png" alt="myimage" />
        </Suspense>
      </CacheProvider>
    );
    const { queryByText, getByAltText } = render(tree);
    expect(queryByText('loading')).toBeDefined();

    imgs.forEach(img => img.onerror?.(new Event('img load')));

    await waitFor(() => expect(getByAltText('myimage')).toBeDefined());
  });

  it('no suspense and no fetch with no src', async () => {
    const tree = (
      <CacheProvider>
        <Suspense fallback="loading">
          <Img alt="myimage" />
        </Suspense>
      </CacheProvider>
    );
    const { getByAltText } = render(tree);

    await waitFor(() => expect(getByAltText('myimage')).toBeDefined());
  });
});
