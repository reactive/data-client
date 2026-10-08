import * as React from 'react';

type ExcludeReadonly<T> = {
  -readonly [K in keyof T as T[K] extends Readonly<any> ? never : K]: T[K];
};
type HTMLProps<K extends keyof HTMLElementTagNameMap> = Partial<
  ExcludeReadonly<HTMLElementTagNameMap[K]> & {
    part: string;
  }
>;
type Justify = 'left' | 'right';

type NumberPartType =
  | Exclude<Intl.NumberFormatPartTypes, 'minusSign' | 'plusSign'>
  | 'sign'
  | 'prefix'
  | 'suffix';
type IntegerPart = {
  type: NumberPartType & 'integer';
  value: number;
};
type FractionPart = {
  type: NumberPartType & 'fraction';
  value: number;
};
type DigitPart = IntegerPart | FractionPart;
type SymbolPart = {
  type: Exclude<NumberPartType, 'integer' | 'fraction'>;
  value: string;
};
type NumberPartKey = string;
type KeyedPart = {
  key: NumberPartKey;
};
type KeyedDigitPart = DigitPart &
  KeyedPart & {
    pos: number;
  };
type KeyedSymbolPart = SymbolPart & KeyedPart;
type KeyedNumberPart = KeyedDigitPart | KeyedSymbolPart;
type Format = Omit<Intl.NumberFormatOptions, 'notation'> & {
  notation?: Exclude<
    Intl.NumberFormatOptions['notation'],
    'scientific' | 'engineering'
  >;
};
type Value = Exclude<
  Parameters<typeof Intl.NumberFormat.prototype.formatToParts>[0],
  bigint | undefined
>;
declare function formatToData(
  value: Value,
  formatter: Intl.NumberFormat,
  prefix?: string,
  suffix?: string,
): {
  pre: KeyedNumberPart[];
  integer: KeyedNumberPart[];
  fraction: KeyedNumberPart[];
  post: KeyedNumberPart[];
  valueAsString: string;
  value: number;
};
type Data = ReturnType<typeof formatToData>;

declare const ServerSafeHTMLElement: {
  new (): HTMLElement;
  prototype: HTMLElement;
};

type Trend = number | ((oldValue: number, value: number) => number);
type DigitOptions = {
  max?: number;
};
type Digits = Record<number, DigitOptions>;
interface Props {
  transformTiming: EffectTiming;
  spinTiming: EffectTiming | undefined;
  opacityTiming: EffectTiming;
  animated: boolean;
  respectMotionPreference: boolean;
  trend: Trend;
  plugins?: Plugin[];
  digits: Digits | undefined;
}
interface NumberFlowLite extends Props {}
/**
 * @internal Used for framework wrappers
 */
declare class NumberFlowLite extends ServerSafeHTMLElement implements Props {
  /**
   * Use `private _private` properties instead of `#private` to avoid # polyfill and
   * reduce bundle size. Also, use `readonly` properties instead of getters to save on bundle
   * size, even though you have to do gross stuff like `(this as Mutable<...>)` until TS
   * supports e.g. https://github.com/microsoft/TypeScript/issues/37487
   */
  static defaultProps: Props;
  constructor();
  private _animated;
  get animated(): boolean;
  set animated(val: boolean);
  readonly created: boolean;
  private _pre?;
  private _num?;
  private _post?;
  readonly computedTrend?: number;
  readonly computedAnimated: boolean;
  private _internals?;
  private _data?;
  /**
   * @internal
   */
  batched: boolean;
  /**
   * @internal
   */
  set data(data: Data | undefined);
  private _preUpdated;
  /**
   * @internal
   */
  willUpdate(): void;
  private _abortAnimationsFinish?;
  /**
   * @internal
   */
  didUpdate(): void;
}
type SectionProps = {
  justify: Justify;
} & HTMLProps<'span'>;
declare abstract class Section {
  readonly flow: NumberFlowLite;
  readonly el: HTMLSpanElement;
  readonly justify: Justify;
  protected children: Map<string, Char<KeyedNumberPart>>;
  constructor(
    flow: NumberFlowLite,
    parts: KeyedNumberPart[],
    { justify, className, ...props }: SectionProps,
    children?: (chars: Node[]) => Node[],
  );
  protected addChar(
    part: KeyedNumberPart,
    {
      startDigitsAtZero,
      ...props
    }?: {
      startDigitsAtZero?: boolean;
    } & Pick<AnimatePresenceProps, 'animateIn'>,
  ): Digit | Sym;
  private onCharRemove;
  protected unpop(char: Char): void;
  protected pop(chars: Map<any, Char>): void;
  protected addNewAndUpdateExisting(parts: KeyedNumberPart[]): void;
  private _prevOffset?;
  willUpdate(): void;
  didUpdate(): void;
}
type OnRemove = () => void;
interface AnimatePresenceProps {
  onRemove?: OnRemove;
  animateIn?: boolean;
}
declare class AnimatePresence {
  readonly flow: NumberFlowLite;
  readonly el: HTMLElement;
  private _present;
  private _onRemove?;
  constructor(
    flow: NumberFlowLite,
    el: HTMLElement,
    { onRemove, animateIn }?: AnimatePresenceProps,
  );
  get present(): boolean;
  private _remove;
  set present(val: boolean);
}
interface CharProps extends AnimatePresenceProps {}
declare abstract class Char<
  P extends KeyedNumberPart = KeyedNumberPart,
> extends AnimatePresence {
  readonly section: Section;
  protected value: P['value'];
  readonly el: HTMLSpanElement;
  constructor(
    section: Section,
    value: P['value'],
    el: HTMLSpanElement,
    props?: AnimatePresenceProps,
  );
  abstract willUpdate(parentRect: DOMRect): void;
  abstract update(value: P['value']): void;
  abstract didUpdate(parentRect: DOMRect): void;
}
declare class Digit extends Char<KeyedDigitPart> {
  readonly pos: number;
  private _numbers;
  readonly length: number;
  constructor(
    section: Section,
    type: KeyedDigitPart['type'],
    value: KeyedDigitPart['value'],
    pos: number,
    props?: CharProps,
  );
  private _prevValue?;
  private _prevCenter?;
  willUpdate(parentRect: DOMRect): void;
  update(value: KeyedDigitPart['value']): void;
  didUpdate(parentRect: DOMRect): void;
  getDelta(): number;
  private _onAnimationsFinish;
}
declare class Sym extends Char<KeyedSymbolPart> {
  private type;
  constructor(
    section: Section,
    type: KeyedSymbolPart['type'],
    value: KeyedSymbolPart['value'],
    props?: CharProps,
  );
  private _children;
  private _prevOffset?;
  willUpdate(parentRect: DOMRect): void;
  private _onChildRemove;
  update(value: KeyedSymbolPart['value']): void;
  didUpdate(parentRect: DOMRect): void;
}

/**
 * Makes number transitions appear to pass through in between numbers.
 */
declare const continuous: Plugin;

type Plugin = {
  onUpdate?(data: Data, prev: Data, context: NumberFlowLite): void;
  getDelta?(value: number, prev: number, context: Digit): number | void;
};

declare const OBSERVED_ATTRIBUTES: readonly ['data', 'digits'];
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number];
declare class NumberFlowElement extends NumberFlowLite {
  static observedAttributes: readonly ['data', 'digits'] | never[];
  attributeChangedCallback(
    attr: ObservedAttribute,
    _oldValue: string,
    newValue: string,
  ): void;
}
type BaseProps = React.HTMLAttributes<NumberFlowElement> &
  Partial<Props> & {
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
declare const NumberFlow: React.ForwardRefExoticComponent<
  React.HTMLAttributes<NumberFlowElement> &
    Partial<Props> & {
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
    } & React.RefAttributes<NumberFlowElement>
>;

declare function NumberFlowGroup({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element;

declare const styles: readonly [string, string, string];

declare const useIsSupported: () => boolean;
declare const usePrefersReducedMotion: () => boolean;
declare function useCanAnimate({
  respectMotionPreference,
}?: {
  respectMotionPreference?: boolean | undefined;
}): boolean;

export {
  type Format,
  NumberFlowElement,
  NumberFlowGroup,
  type NumberFlowProps,
  type NumberPartType,
  type Plugin,
  type Trend,
  type Value,
  continuous,
  NumberFlow as default,
  styles,
  useCanAnimate,
  useIsSupported,
  usePrefersReducedMotion,
};
