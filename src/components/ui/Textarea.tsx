import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>


export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={twMerge(
      'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
      className,
    )}
    {...props}
  />
))

Textarea.displayName = 'Textarea'
