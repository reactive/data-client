import React, { Children, ReactNode, isValidElement } from 'react';

import { useFrameworkStorage, Framework } from './FrameworkSelector';

interface TabItemProps {
  value: Framework;
  children: ReactNode;
}

// Helper component for specifying framework-specific content
export function TabItem({ children }: TabItemProps): JSX.Element {
  return <>{children}</>;
}

interface FrameworkTabsProps {
  children: ReactNode;
}

/**
 * FrameworkTabs component that conditionally renders React or Vue content
 * based on the global framework selector state.
 *
 * Usage in MDX:
 * ```jsx
 * <FrameworkTabs>
 *   <TabItem value="react">
 *     {/* React example *\/}
 *   </TabItem>
 *   <TabItem value="vue">
 *     {/* Vue example *\/}
 *   </TabItem>
 * </FrameworkTabs>
 * ```
 */
export default function FrameworkTabs({
  children,
}: FrameworkTabsProps): JSX.Element | null {
  const [framework] = useFrameworkStorage();

  // Find the child that matches the current framework
  const childArray = Children.toArray(children);

  for (const child of childArray) {
    if (isValidElement(child) && child.props.value === framework) {
      // Key forces React to unmount/remount children when framework changes
      // This ensures editors and other stateful components reset properly
      return (
        <React.Fragment key={framework}>{child.props.children}</React.Fragment>
      );
    }
  }

  // No matching tab found - render nothing
  return null;
}
