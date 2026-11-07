import type { Props } from '@theme/Details';
import Details from '@theme-original/Details';
import React, { type MouseEvent } from 'react';

import {
  HiddenProvider,
  useHiddenUntilIdle,
} from '../../components/Playground/hiddenContext';

/** A closed `<details>`'s code and playgrounds wait in the server HTML and
 * draw once the page is idle (HiddenContext), ready before it opens */
export default function DetailsWrapper(props: Props) {
  const [hidden, reveal] = useHiddenUntilIdle(!props.open);
  return (
    <HiddenProvider hidden={hidden}>
      <Details
        {...props}
        // opened before the page was idle: draw it in the click that opens
        // it (Details itself takes onClick). Its own summary only, as
        // Docusaurus's Details checks with isInSummary and hasParent
        onClickCapture={(event: MouseEvent<HTMLDetailsElement>) => {
          if (
            (event.target as Element).closest('summary')?.parentElement ===
            event.currentTarget
          )
            reveal();
          props.onClickCapture?.(event);
        }}
      />
    </HiddenProvider>
  );
}
