import { Form, Button, Input, Space } from 'antd';
import { useLoading } from '@rest-hooks/hooks';
import { memo } from 'react';

const { TextArea } = Input;

function CommentForm({
  onFinish,
  label = 'Comment',
  initialValues,
  onCancel,
}: {
  onFinish: (data: { body: string }) => Promise<unknown>;
  onCancel?: () => void;
  label: string;
  initialValues?: any;
}) {
  const [handleSubmit, loading] = useLoading(onFinish, [onFinish]);
  return (
    <Form
      name="basic"
      onFinish={handleSubmit}
      onFinishFailed={() => {}}
      autoComplete="off"
      initialValues={initialValues}
    >
      <Form.Item
        name="body"
        rules={[{ required: true, message: 'Content is required' }]}
      >
        <TextArea rows={4} autoSize={{ minRows: 3, maxRows: 20 }} />
      </Form.Item>

      <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
        <Space>
          {onCancel ? <Button onClick={onCancel}>Cancel</Button> : null}
          <Button type="primary" htmlType="submit" loading={loading}>
            {label}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

export default memo(CommentForm);
