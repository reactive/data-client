import type { Props } from '@theme/Details';
import Details from '@theme-original/Details';
import React, { useState, type MouseEvent, type ToggleEvent } from 'react';

import { HiddenProvider } from '../../components/Playground/hiddenContext';

/** A closed `<details>`'s code and playgrounds wait until it first opens
 * (HiddenContext), then stay, so closing never redraws them */
export default function DetailsWrapper(props: Props) {
  const [opened, setOpened] = useState(!!props.open);
  return (
    <HiddenProvider hidden={!opened}>
      <Details
        {...props}
        // in the click that opens it, so it opens drawn. Details itself
        // takes onClick. A click on this details' own summary, as Docusaurus's
        // Details tests it
        onClickCapture={(event: MouseEvent<HTMLDetailsElement>) => {
          if (
            (event.target as Element).closest('summary')?.parentElement ===
            event.currentTarget
          )
            setOpened(true);
          props.onClickCapture?.(event);
        }}
        // the browser opening it: find in page, a link to inside it
        onToggle={(event: ToggleEvent<HTMLDetailsElement>) => {
          if (event.currentTarget.open) setOpened(true);
          props.onToggle?.(event);
        }}
      />
    </HiddenProvider>
  );
}
