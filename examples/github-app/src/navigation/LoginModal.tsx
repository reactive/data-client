import { Button, Modal } from 'antd';
import { useCallback, useContext } from 'react';

import { authdContext } from './authdContext';
import LoginForm from './LoginForm';

export default function LoginModal({
  visible,
  handleClose,
}: {
  visible: boolean;
  handleClose: () => void;
}) {
  const { login } = useContext(authdContext);
  const handleOk = useCallback(() => {
    handleClose();
  }, []);
  const handleCancel = useCallback(() => {
    handleClose();
  }, []);
  const onFinish = useCallback((data: { login: string; token: string }) => {
    login(data);
    handleClose();
  }, []);

  return (
    <Modal
      visible={visible}
      title="Login"
      onOk={handleOk}
      onCancel={handleCancel}
      footer={null}
    >
      <p>
        Get your token from{' '}
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noreferrer"
        >
          https://github.com/settings/tokens
        </a>
      </p>
      <p>Information is only sent to github servers</p>
      <LoginForm onFinish={onFinish} />
    </Modal>
  );
}
