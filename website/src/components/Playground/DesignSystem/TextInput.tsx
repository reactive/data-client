import classnames from 'clsx';
import React, { type InputHTMLAttributes } from 'react';

export function TextInput({
  label,
  children,
  loading = false,
  size = 'medium',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  children?: React.ReactNode;
  label?: React.ReactNode;
  loading?: boolean;
  size?: 'large' | 'medium' | 'small';
}) {
  return (
    <span
      className={classnames('rt-TextFieldRoot', {
        large: size === 'large',
        medium: size === 'medium',
        small: size === 'small',
      })}
    >
      {children}
      <input className="rt-TextFieldInput" {...props} />
      {label ?
        <label className="rt-TextFieldLabel">{label}</label>
      : null}
      {loading ?
        <div className="rt-TextFieldSpinner">
          <div className="rt-Spinner"></div>
        </div>
      : null}
    </span>
  );
}
