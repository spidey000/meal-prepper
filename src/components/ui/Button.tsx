import { forwardRef } from 'react'
import { twMerge } from 'tailwind-merge'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-500 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-ember-500 to-ember-600 text-white hover:from-ember-400 hover:to-ember-500 shadow-lg shadow-ember-500/20 hover:shadow-ember-500/30',
  secondary:
    'bg-surface-800 text-surface-200 border border-surface-700 hover:bg-surface-700 hover:border-surface-600',
  ghost: 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50',
  danger:
    'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={twMerge(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      {...props}
    />
  ),
)

Button.displayName = 'Button'
