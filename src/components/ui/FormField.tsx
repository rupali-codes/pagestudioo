/**
 * FormField — accessible label + input wrapper.
 *
 * Pairs a <label> with any form control via htmlFor/id.
 * Renders an optional description and error message with correct aria
 * attributes so screen readers announce them automatically.
 */

import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  const descId = description ? `${id}-desc` : undefined;
  const errId = error ? `${id}-err` : undefined;

  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-gray-700"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>

      {/* Clone children to inject aria-describedby */}
      <div
        // Pass aria attributes down via a wrapper div — the actual input
        // must set its own id and pick up aria-describedby from context.
        // We use data attributes here; the Input component reads them.
        data-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
        data-invalid={error ? 'true' : undefined}
      >
        {children}
      </div>

      {description && !error && (
        <p id={descId} className="text-xs text-gray-500">
          {description}
        </p>
      )}

      {error && (
        <p id={errId} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
