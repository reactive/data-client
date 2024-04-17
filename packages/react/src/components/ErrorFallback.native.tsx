import { Text } from 'react-native';

const ErrorFallback = ({
  error,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  className: string;
}) => <Text role="alert">{error.message}</Text>;

export default ErrorFallback;
