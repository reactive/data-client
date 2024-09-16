import classnames from 'clsx';
import React, { type InputHTMLAttributes } from 'react';

export function TextArea({
  label,
  ...props
}: InputHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
}) {
  return (
    <div className="rt-TextAreaRoot">
      <textarea className="rt-TextAreaInput" {...props} />
      <label className="rt-TextFieldLabel" htmlFor={props.name}>
        {label}
      </label>
    </div>
  );
}
