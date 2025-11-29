// Import the original mapper
import { RestEndpoint } from '@data-client/rest';
import MDXComponents from '@theme-original/MDXComponents';

import FrameworkTabs, {
  TabItem as FrameworkTabItem,
} from '@site/src/components/FrameworkTabs';

export default {
  ...MDXComponents,
  RestEndpoint,
  FrameworkTabs,
  FrameworkTabItem,
};
