import classnames from 'clsx';
import React, { type TextareaHTMLAttributes } from 'react';

export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
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
