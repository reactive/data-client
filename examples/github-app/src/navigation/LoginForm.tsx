import { useLoading } from '@data-client/react';
import { Button, Checkbox, Form, Input } from 'antd';

export default function LoginForm({
  onFinish,
}: {
  onFinish: (values: any) => Promise<void>;
}) {
  const [handleFinish, loading, error] = useLoading(onFinish, [onFinish]);

  return (
    <Form
      name="basic"
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      initialValues={{ remember: true }}
      onFinish={handleFinish}
    >
      <Form.Item
        label="Username"
        name="login"
        rules={[{ required: true, message: 'Please input your username!' }]}
        validateStatus={error ? 'error' : ''}
        help={
          (error as any)?.status === 401
            ? 'Username and token were not valid'
            : ''
        }
      >
        <Input autoFocus />
      </Form.Item>

      <Form.Item
        label="Access Token"
        name="token"
        rules={[{ required: true, message: 'Please input your password!' }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        name="remember"
        valuePropName="checked"
        wrapperCol={{ offset: 8, span: 16 }}
      >
        <Checkbox>Remember me</Checkbox>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" disabled={loading}>
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
