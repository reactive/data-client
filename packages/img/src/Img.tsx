import { useSuspense } from '@data-client/react';
import React from 'react';

import getImage from './getImage.js';

type Props<
  C extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<{ src: string }> = 'img',
> = React.ComponentProps<C> & { component: C };

export default function Img<
  C extends
    | keyof JSX.IntrinsicElements
    | React.JSXElementConstructor<any> = 'img',
>(props: Props<C>): React.ReactElement {
  const { component, ...rest } = props;
  useSuspense(getImage, rest.src ? { src: rest.src } : null);
  return React.createElement(component, rest);
}
Img.defaultProps = {
  component: 'img',
};
