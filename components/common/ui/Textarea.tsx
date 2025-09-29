import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const baseInputClasses = "w-full bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none transition-colors";
const errorInputClasses = "border-red-500 focus:ring-red-500";
const normalInputClasses = "border-border-color focus:ring-accent";

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={`${baseInputClasses} ${error ? errorInputClasses : normalInputClasses} ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
