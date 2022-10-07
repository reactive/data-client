import { JSONTree } from 'react-json-tree';
import React, { useMemo } from 'react';
import { useColorMode, usePrismTheme } from '@docusaurus/theme-common';

export default function Output({ value }: { value: any }) {
  const isDarkTheme = useColorMode().colorMode === 'dark';
  const valueColorMap = useMemo(
    () => ({
      String: 'rgb(195, 232, 141)',
      Date: 'rgb(247, 140, 108)',
      Number: 'rgb(247, 140, 108)',
      Boolean: 'rgb(247, 140, 108)',
      Null: 'rgb(255, 88, 116)',
      Undefined: 'rgb(255, 88, 116)',
      Function: 'rgb(247, 140, 108)',
      Symbol: 'rgb(247, 140, 108)',
    }),
    [],
  );
  const theme = useMemo(
    () => ({
      tree: {
        overflow: 'auto',
        flex: '4 1 70%',
        margin: 0,
        padding: '0 0.5rem 0 0.8rem',
        backgroundColor: isDarkTheme
          ? 'var(--ifm-pre-background)'
          : 'rgb(41, 45, 62)',
        font: 'var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace) !important',
        color: 'rgb(227, 227, 227)',
      },
      arrowContainer: ({ style }, arrowStyle) => ({
        style: {
          ...style,
          fontFamily: 'arial',
          padding: '7px 7px 7px 0',
          margin: '-7px calc(0.5em - 7px) -7px 0',
        },
      }),
      arrowSign: {
        color: 'rgb(130, 170, 255)',
      },
      label: {
        color: 'rgb(130, 170, 255)',
      },
      itemRange: {
        color: 'rgb(105, 112, 152)',
      },
      valueText: ({ style }, nodeType: keyof typeof valueColorMap) => ({
        style: {
          ...style,
          color: valueColorMap[nodeType],
        },
      }),
      base0B: 'rgb(191, 199, 213)',
    }),
    [isDarkTheme, valueColorMap],
  );
  return (
    <JSONTree
      shouldExpandNode={shouldExpandNode}
      data={value}
      valueRenderer={valueRenderer}
      theme={theme}
      hideRoot={true}
    />
  );
}

function shouldExpandNode(keyName, data, level) {
  if (level === 0) return true;
  if (level === 1 && ['entities', 'results'].includes(keyName[0])) return true;
  if (level === 2 && keyName[1] === 'entities') return true;
  if (level === 2 && keyName[1] === 'results') return true;
  if (level === 3 && keyName[2] === 'entities') return true;
  if (level === 3 && keyName[2] === 'results') return true;
  return false;
}

const HASINTL = typeof Intl !== 'undefined';

function valueRenderer(
  valueAsString: string,
  value: unknown,
  ...keyPath: string[]
) {
  const key = keyPath[0];
  if (
    HASINTL &&
    typeof value === 'number' &&
    typeof key === 'string' &&
    isFinite(value) &&
    (key === 'date' || key.endsWith('At'))
  ) {
    return Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: 3,
    }).format(value);
  }
  return valueAsString;
}
