const ErrorFallback = ({
  error,
  className,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  className?: string;
}) => (
  <pre role="alert" className={className}>
    {error.message}
  </pre>
);

export default ErrorFallback;
