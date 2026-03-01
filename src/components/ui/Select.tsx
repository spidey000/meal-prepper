import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={twMerge(
        'w-full rounded-xl border border-surface-700 bg-surface-800/50 px-4 py-2.5 text-sm text-surface-200 transition-all duration-200 focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-500/20',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)

Select.displayName = 'Select'
