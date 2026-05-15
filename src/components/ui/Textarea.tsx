import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={3}
        className={cn(
          'w-full resize-y rounded-md border bg-white px-3 py-1.5 text-sm text-gray-900',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300',
          className,
        )}
        {...props}
      />
    );
  },
);

Textarea.displayName = 'Textarea';
