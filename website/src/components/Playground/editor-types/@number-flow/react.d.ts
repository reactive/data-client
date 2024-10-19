import { NumberFlowLite, Value, Format } from 'number-flow';
import * as React from 'react';
export { Format, Trend, Value } from 'number-flow';

declare const OBSERVED_ATTRIBUTES: readonly ['parts'];
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number];
declare class NumberFlowElement extends NumberFlowLite {
  static observedAttributes: readonly ['parts'];
  attributeChangedCallback(
    attr: ObservedAttribute,
    _oldValue: string,
    newValue: string,
  ): void;
}
type NumberFlowProps = React.HTMLAttributes<NumberFlowElement> & {
  value: Value;
  locales?: Intl.LocalesArgument;
  format?: Format;
  isolate?: boolean;
  animated?: boolean;
  respectMotionPreference?: boolean;
  willChange?: boolean;
  onAnimationsStart?: () => void;
  onAnimationsFinish?: () => void;
  trend?: (typeof NumberFlowElement)['prototype']['trend'];
  opacityTiming?: (typeof NumberFlowElement)['prototype']['opacityTiming'];
  transformTiming?: (typeof NumberFlowElement)['prototype']['transformTiming'];
  spinTiming?: (typeof NumberFlowElement)['prototype']['spinTiming'];
};
declare const NumberFlow: (
  options: React.HTMLAttributes<NumberFlowElement> & {
    value: Value;
    locales?: Intl.LocalesArgument;
    format?: Format;
    isolate?: boolean;
    animated?: boolean;
    respectMotionPreference?: boolean;
    willChange?: boolean;
    onAnimationsStart?: () => void;
    onAnimationsFinish?: () => void;
    trend?: (typeof NumberFlowElement)['prototype']['trend'];
    opacityTiming?: (typeof NumberFlowElement)['prototype']['opacityTiming'];
    transformTiming?: (typeof NumberFlowElement)['prototype']['transformTiming'];
    spinTiming?: (typeof NumberFlowElement)['prototype']['spinTiming'];
  } & React.RefAttributes<NumberFlowElement>,
) => JSX.Element;

declare function useCanAnimate({
  respectMotionPreference,
}?: {
  respectMotionPreference?: boolean | undefined;
}): boolean;

export {
  NumberFlowElement,
  type NumberFlowProps,
  NumberFlow as default,
  useCanAnimate,
};
