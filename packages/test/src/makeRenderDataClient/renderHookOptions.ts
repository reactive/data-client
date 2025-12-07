import type { queries } from '@testing-library/dom';
import type { Queries, RenderOptions } from '@testing-library/react';
import * as ReactDOMClient from 'react-dom/client';

export type RenderHookOptions<
  Props,
  Q extends Queries = typeof queries,
  Container extends RendererableContainer | HydrateableContainer = HTMLElement,
  BaseElement extends RendererableContainer | HydrateableContainer = Container,
> =
  | import('@testing-library/react').RenderHookOptions<
      Props,
      Q,
      Container,
      BaseElement
    >
  | (RenderOptions<Q, Container, BaseElement> & {
      /**
       * The argument passed to the renderHook callback. Can be useful if you plan
       * to use the rerender utility to change the values passed to your hook.
       */
      initialProps?: Props | undefined;
    });

type RendererableContainer = ReactDOMClient.Container;
type HydrateableContainer = Parameters<
  (typeof ReactDOMClient)['hydrateRoot']
>[0];
