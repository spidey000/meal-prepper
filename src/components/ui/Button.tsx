import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 focus-visible:outline-brand-600',
  secondary:
    'bg-white text-slate-900 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus-visible:outline-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:outline-slate-400 dark:text-slate-200 dark:hover:bg-slate-800',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'md', ...props }, ref) => (
  <button ref={ref} className={twMerge(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props} />
))

Button.displayName = 'Button'
