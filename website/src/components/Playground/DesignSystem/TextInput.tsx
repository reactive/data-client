import classnames from 'clsx';
import React, { type InputHTMLAttributes } from 'react';

export function TextInput({
  loading = false,
  label,
  children,
  large = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  children?: React.ReactNode;
  label?: React.ReactNode;
  loading?: boolean;
  large?: boolean;
}) {
  return (
    <div className={classnames('rt-TextFieldRoot', { large })}>
      {children}
      <input spellCheck="false" className="rt-TextFieldInput" {...props} />
      {label ?
        <label className="rt-TextFieldLabel">{label}</label>
      : null}
      {loading ?
        <div className="rt-TextFieldSpinner">
          <div className="rt-Spinner"></div>
        </div>
      : null}
    </div>
  );
}
