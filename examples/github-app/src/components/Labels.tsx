import { Tag } from 'antd';
import { memo } from 'react';
import { type Label } from 'resources/Label';

function Labels({ labels }: { labels: Label[] }) {
  return (
    <div>
      {labels.map((label) => (
        <Tag key={label.pk()} color={`#${label.color}`}>
          {label.name}
        </Tag>
      ))}
    </div>
  );
}
export default memo(Labels);
