import { InfoCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';
import React from 'react';

export const stateToIcon: Record<string, React.ReactNode> = {
  closed: <IssuesCloseOutlined />,
  open: <InfoCircleOutlined />,
};
