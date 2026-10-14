import React, { isValidElement } from 'react';

/**
 * MDX children grouped from each heading (the elements with an id) to the
 * next, one group per column; content before the first heading would take a
 * column of its own, so the MDX starts with a heading
 */
export default function splitAtHeadings(
  children: React.ReactNode,
): React.ReactNode[][] {
  const groups: React.ReactNode[][] = [];
  for (const child of React.Children.toArray(children)) {
    if (
      (isValidElement<{ id?: string }>(child) && child.props.id) ||
      !groups.length
    )
      groups.push([]);
    groups[groups.length - 1].push(child);
  }
  return groups;
}
