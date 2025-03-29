export * from 'number-flow/plugins';
import * as React from 'react';
import NumberFlowLite, { Value, Format, Props } from 'number-flow/lite';
export { Format, NumberPartType, Trend, Value } from 'number-flow/lite';

declare const OBSERVED_ATTRIBUTES: readonly ["data", "digits"];
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number];
declare class NumberFlowElement extends NumberFlowLite {
    static observedAttributes: readonly ["data", "digits"] | never[];
    attributeChangedCallback(attr: ObservedAttribute, _oldValue: string, newValue: string): void;
}
type BaseProps = React.HTMLAttributes<NumberFlowElement> & Partial<Props> & {
    isolate?: boolean;
    willChange?: boolean;
    onAnimationsStart?: (e: CustomEvent<undefined>) => void;
    onAnimationsFinish?: (e: CustomEvent<undefined>) => void;
};
type NumberFlowProps = BaseProps & {
    value: Value;
    locales?: Intl.LocalesArgument;
    format?: Format;
    prefix?: string;
    suffix?: string;
};
declare const NumberFlow: React.ForwardRefExoticComponent<React.HTMLAttributes<NumberFlowElement> & Partial<Props> & {
    isolate?: boolean;
    willChange?: boolean;
    onAnimationsStart?: (e: CustomEvent<undefined>) => void;
    onAnimationsFinish?: (e: CustomEvent<undefined>) => void;
} & {
    value: Value;
    locales?: Intl.LocalesArgument;
    format?: Format;
    prefix?: string;
    suffix?: string;
} & React.RefAttributes<NumberFlowElement>>;

declare function NumberFlowGroup({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;

declare const useIsSupported: () => boolean;
declare const usePrefersReducedMotion: () => boolean;
declare function useCanAnimate({ respectMotionPreference }?: {
    respectMotionPreference?: boolean | undefined;
}): boolean;

export { NumberFlowElement, NumberFlowGroup, type NumberFlowProps, NumberFlow as default, useCanAnimate, useIsSupported, usePrefersReducedMotion };
