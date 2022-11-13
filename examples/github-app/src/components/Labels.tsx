import { Tag } from 'antd';
import { memo } from 'react';
import LabelResource from 'resources/LabelResource';

function Labels({ labels }: { labels: LabelResource[] }) {
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
