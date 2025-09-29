import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const baseInputClasses = "w-full bg-primary border rounded-md p-2 text-text-main focus:ring-2 focus:outline-none transition-colors";
const errorInputClasses = "border-red-500 focus:ring-red-500";
const normalInputClasses = "border-border-color focus:ring-accent";

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        className={`${baseInputClasses} ${error ? errorInputClasses : normalInputClasses} ${className || ''}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
