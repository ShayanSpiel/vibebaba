import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-10 w-full rounded-xl border-[0.75px] border-border-light bg-background-raised px-3 py-2 text-base text-text-primary placeholder:text-text-subtle focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-border-focus/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary',
            error && 'border-error/60 focus-visible:border-error focus-visible:ring-error/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-text-secondary">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
