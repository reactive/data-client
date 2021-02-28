import React, { ImgHTMLAttributes } from 'react';
import { useResource } from '@rest-hooks/core';

import getImage from './getImage';

export default function Img(
  props: ImgHTMLAttributes<HTMLImageElement>,
): React.ReactElement {
  const { src, alt } = props;
  useResource(getImage, src ? { src } : null);
  return <img alt={alt} {...props} />;
}
