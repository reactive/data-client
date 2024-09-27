import { Tag, Space } from 'antd';
import { memo } from 'react';

import type { Label } from '@/resources/Label';

function Labels({ labels }: { labels: Label[] }) {
  return (
    <Space size={[0, 8]} wrap>
      {labels.map((label) => (
        <Tag key={label.pk()} color={`#${label.color}`}>
          {label.name}
        </Tag>
      ))}
    </Space>
  );
}
export default memo(Labels);
