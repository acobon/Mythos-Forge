import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const baseInputClasses = "w-full bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none transition-colors";
const errorInputClasses = "border-red-500 focus:ring-red-500";
const normalInputClasses = "border-border-color focus:ring-accent";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`${baseInputClasses} ${error ? errorInputClasses : normalInputClasses} ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
