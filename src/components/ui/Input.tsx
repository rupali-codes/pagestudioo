/**
 * Input — styled text input with full accessibility support.
 *
 * Forwards all native input attributes so it works as a drop-in replacement
 * for <input>. Pairs with <FormField> for label/error wiring.
 */

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-md border bg-white px-3 py-1.5 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
