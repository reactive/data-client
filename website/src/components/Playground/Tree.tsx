import JSONTree from 'react-json-tree';
import React, { useMemo } from 'react';
import usePrismTheme from '@theme/hooks/usePrismTheme';
import useThemeContext from '@theme/hooks/useThemeContext';

export default function Output({ value }: { value: any }) {
  //const prismTheme = usePrismTheme();
  const { isDarkTheme } = useThemeContext();
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
  return (
    <JSONTree
      shouldExpandNode={shouldExpandNode}
      data={value}
      theme={{
        tree: {
          overflow: 'auto',
          flex: '4 1 70%',
          margin: 0,
          padding: '0 0.5rem',
          'background-color': isDarkTheme
            ? 'var(--ifm-pre-background)'
            : 'rgb(41, 45, 62)',
          font: 'var(--ifm-code-font-size) / var(--ifm-pre-line-height) var(--ifm-font-family-monospace) !important',
        },
        arrowContainer: ({ style }, arrowStyle) => ({
          style: {
            ...style,
            'font-family': 'arial',
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
        valueText: ({ style }, nodeType) => ({
          style: {
            ...style,
            color: valueColorMap[nodeType],
          },
        }),
        base0B: 'rgb(191, 199, 213)',
      }}
    />
  );
}

function shouldExpandNode(keyName, data, level) {
  if (level === 0) return true;
  if (level === 1 && ['entities', 'results'].includes(keyName[0])) return true;
  if (level === 2 && keyName[1] === 'entities') return true;
  if (level === 2 && keyName[1] === 'results') return true;
  if (level === 3 && keyName[2] === 'entities') return true;
  return false;
}
