import { CacheProvider } from '@rest-hooks/core';
import { render, waitFor } from '@testing-library/react';
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
