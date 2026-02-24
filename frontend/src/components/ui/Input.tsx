'use client';
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s/g, '-').toLowerCase();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border bg-white text-gray-800 text-sm',
            'placeholder:text-gray-400',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            error
              ? 'border-error focus:ring-error'
              : 'border-gray-300 hover:border-gray-400',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'read-only:bg-gray-50',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-[13px] text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-[13px] text-gray-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
