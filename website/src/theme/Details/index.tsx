import type { Props } from '@theme/Details';
import Details from '@theme-original/Details';
import React, {
  useContext,
  useState,
  type MouseEvent,
  type ToggleEvent,
} from 'react';

import { PlaygroundHiddenContext } from '../../components/Playground/hiddenContext';

/** A closed `<details>`'s code and playgrounds wait until it first opens
 * (PlaygroundHiddenContext), then stay, so closing never redraws them */
export default function DetailsWrapper(props: Props) {
  const inheritedHidden = useContext(PlaygroundHiddenContext);
  const [opened, setOpened] = useState(!!props.open);
  return (
    <PlaygroundHiddenContext.Provider value={inheritedHidden || !opened}>
      <Details
        {...props}
        // in the click that opens it, so it opens drawn; Details itself
        // takes onClick
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
    </PlaygroundHiddenContext.Provider>
  );
}
